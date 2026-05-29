import { useState, useEffect, useCallback } from 'react';
import { parseSGF, buildIndex } from '../lib/sgfParser';

const SGF_FILES = [
  'Edmund-Hong.sgf',
  'Hong-eric.sgf',
  'Hong-qiyou.sgf',
  'V53.sgf',
  'arroganer.sgf',
  'chengyi.sgf',
  'hong-ding.sgf',
  'hong-max-contest.sgf',
  'hong-wangjia.sgf',
  'max-hong.sgf',
  'mznxb.sgf',
  'test-hong.sgf',
  'wanqi-henry.sgf',
  '[妙手与俗手]vs[blockchain]1754185785030051585.sgf',
  '[一周七盘]vs[blockchain]1754274299030012914.sgf',
  '[113谢大大]vs[blockchain]1754370366030051998.sgf',
  '[blockchain]vs[newyear689]1779152661030041740.sgf',
  '[blockchain]vs[金刚石1111]1754460202030052828.sgf',
  '[blockchain]vs[如风岁月19]1754358938030012891.sgf',
  '[blockchain]vs[陈逸凡01]1779238521030041232.sgf',
  '[V530857008]vs[blockchain]1754808565030054811.sgf',
  '[雄鹰zcg]vs[blockchain]1754631964030031226.sgf',
  '[随着16]vs[blockchain]1779420094030060398.sgf',
  '[麻将12]vs[blockchain]1779418746030041500.sgf',
];

export function useAppState() {
  // All data lives here in memory — no localStorage or JSON caching
  const [index, setIndex] = useState(null); // { labels, gameMoves }
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [selectedLabel, setSelectedLabel] = useState(null);
  const [selectedGame, setSelectedGame] = useState(null); // filename for replay
  const [labelBeforeReplay, setLabelBeforeReplay] = useState(null);
  const [positionsPerRow, setPositionsPerRow] = useState(3);

  useEffect(() => {
    async function loadAll() {
      try {
        const results = await Promise.all(
          SGF_FILES.map(async (name) => {
            const res = await fetch(`${import.meta.env.BASE_URL}sgf/${encodeURIComponent(name)}`);
            if (!res.ok) throw new Error(`Failed to load ${name}`);
            const text = await res.text();
            return parseSGF(text, name);
          })
        );
        setIndex(buildIndex(results));
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    }
    loadAll();
  }, []);

  const labels = index ? Object.keys(index.labels).sort() : [];
  const games = index ? Object.keys(index.gameMoves).sort() : [];

  const labelPositions = selectedLabel && index ? index.labels[selectedLabel] ?? [] : [];
  const replayMoves = selectedGame && index ? index.gameMoves[selectedGame] ?? [] : [];

  const selectLabel = useCallback((label) => {
    setSelectedLabel(label);
    setSelectedGame(null);
  }, []);

  const selectGame = useCallback((game) => {
    setLabelBeforeReplay(prev => game ? selectedLabel : prev);
    setSelectedGame(game);
    if (game) setSelectedLabel(null);
  }, [selectedLabel]);

  const closeReplay = useCallback(() => {
    setSelectedGame(null);
    setSelectedLabel(labelBeforeReplay);
    setLabelBeforeReplay(null);
  }, [labelBeforeReplay]);

  return {
    loading, error,
    labels, games, index,
    selectedLabel, selectedGame,
    labelPositions, replayMoves,
    positionsPerRow, setPositionsPerRow,
    selectLabel, selectGame, closeReplay,
  };
}

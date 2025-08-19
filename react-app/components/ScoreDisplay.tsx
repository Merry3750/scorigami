interface ScoreDisplayProps {
  homeScore: number;
  awayScore: number;
  homeTeam: string;
  awayTeam: string;
}

interface ScoreDisplayState {
  isHighlighted: boolean;
}

function ScoreDisplay(props: ScoreDisplayProps): any {
  const { homeScore, awayScore, homeTeam, awayTeam } = props;

  const isScorigami = (): boolean => {
    // This would check against your scorigami data
    // For now, just return false as placeholder
    return false;
  };

  const handleClick = (): void => {
    console.log(`Score: ${awayTeam} ${awayScore} - ${homeScore} ${homeTeam}`);
  };

  return window.React.createElement('div', {
    className: `score-display ${isScorigami() ? 'scorigami' : ''}`,
    onClick: handleClick,
    style: {
      padding: '8px',
      border: '1px solid #ccc',
      borderRadius: '4px',
      cursor: 'pointer',
      backgroundColor: isScorigami() ? '#90EE90' : '#f5f5f5'
    }
  },
    window.React.createElement('div', null, `${awayTeam} ${awayScore}`),
    window.React.createElement('div', null, `${homeTeam} ${homeScore}`),
    isScorigami() && window.React.createElement('div', {
      style: { color: 'red', fontWeight: 'bold' }
    }, 'SCORIGAMI!')
  );
}

export { ScoreDisplay };

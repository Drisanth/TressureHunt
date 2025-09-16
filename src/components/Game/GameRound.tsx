import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { gameAPI } from '../../services/api';
import { Round, ValidationResponse } from '../../types';
import HintModal from './HintModal';
import SuccessModal from './SuccessModal';
import ErrorModal from './ErrorModal';
import './GameRound.css';

interface GameRoundProps {
  teamId: string;
}

const GameRound: React.FC<GameRoundProps> = ({ teamId }) => {
  const { user } = useAuth();
  const [round, setRound] = useState<Round | null>(null);
  const [userInput, setUserInput] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isValidating, setIsValidating] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showError, setShowError] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [nextClue, setNextClue] = useState('');
  const [nextClueType, setNextClueType] = useState<'text' | 'image'>('text');
  const [canProceed, setCanProceed] = useState(false);
  const [countdown, setCountdown] = useState(0);

  useEffect(() => {
    loadCurrentRound();
  }, [teamId]);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    } else if (countdown === 0 && canProceed) {
      setCanProceed(false);
    }
    return () => clearTimeout(timer);
  }, [countdown, canProceed]);

  const loadCurrentRound = async () => {
    try {
      setIsLoading(true);
      const response = await gameAPI.getCurrentRound(teamId);
      if (response.success) {
        setRound(response.round);
      }
    } catch (error) {
      console.error('Error loading round:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!userInput.trim() || !round) return;

    setIsValidating(true);
    try {
      const response: ValidationResponse = await gameAPI.validateInput(
        teamId,
        round.roundNumber,
        round.currentStep.stepNumber,
        userInput.trim()
      );

      if (response.success) {
        setSuccessMessage(response.message);
        setNextClue(response.nextClue || '');
        setNextClueType(response.nextClueType || 'text');
        setShowSuccess(true);
        setUserInput('');
        
        if (response.isLastStep) {
          setCountdown(10);
          setCanProceed(true);
        }
        
        // Reload round data to get updated step
        setTimeout(() => {
          loadCurrentRound();
        }, 1000);
      } else {
        setErrorMessage(response.message);
        setShowError(true);
      }
    } catch (error) {
      setErrorMessage('Validation failed. Please try again.');
      setShowError(true);
    } finally {
      setIsValidating(false);
    }
  };

  const handleNextRound = async () => {
    try {
      const response = await gameAPI.moveToNextRound(teamId);
      if (response.success) {
        if (response.isGameComplete) {
          // Redirect to completion page
          window.location.href = 'https://example.com/completion';
        } else {
          loadCurrentRound();
        }
      }
    } catch (error) {
      console.error('Error moving to next round:', error);
    }
  };

  const handleHintClick = () => {
    setShowHint(true);
  };

  if (isLoading) {
    return (
      <div className="game-container">
        <div className="loading">
          <div className="spinner"></div>
          <p>Loading round...</p>
        </div>
      </div>
    );
  }

  if (!round) {
    return (
      <div className="game-container">
        <div className="error-state">
          <h2>Round not found</h2>
          <p>Unable to load the current round. Please try refreshing the page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="game-container">
      <div className="game-header">
        <div className="team-info">
          <h1>{user?.teamName}</h1>
          <p>Team ID: {user?.teamId}</p>
        </div>
        <div className="progress-info">
          <div className="round-indicator">
            Round {round.roundNumber + 1} of 6
          </div>
          <div className="step-indicator">
            Step {round.currentStep.stepNumber + 1} of {round.totalSteps}
          </div>
        </div>
      </div>

      <div className="progress-bar">
        <div 
          className="progress-fill" 
          style={{ width: `${((round.roundNumber + 1) / 6) * 100}%` }}
        ></div>
      </div>

      <div className="round-content">
        <div className="clue-section">
          <div className="clue-header">
            <h2>Clue</h2>
            <button 
              className="hint-button"
              onClick={handleHintClick}
              title="Get hint"
            >
              ℹ️
            </button>
          </div>
          
          <div className="clue-content">
            {round.clueType === 'image' ? (
              <img 
                src={round.clueContent} 
                alt="Clue" 
                className="clue-image"
              />
            ) : (
              <p className="clue-text">{round.clueContent}</p>
            )}
          </div>
        </div>

        {nextClue && (
          <div className="additional-clue">
            <h3>Additional Information</h3>
            {nextClueType === 'image' ? (
              <img 
                src={nextClue} 
                alt="Additional clue" 
                className="clue-image"
              />
            ) : (
              <p className="clue-text">{nextClue}</p>
            )}
          </div>
        )}

        <form onSubmit={handleSubmit} className="input-section">
          <div className="input-group">
            <label htmlFor="answer">
              Your Answer ({round.currentStep.inputType})
            </label>
            <input
              type="text"
              id="answer"
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              placeholder={`Enter your ${round.currentStep.inputType} answer`}
              disabled={isValidating || round.currentStep.isCompleted}
              className={round.currentStep.isCompleted ? 'completed' : ''}
            />
          </div>

          <button 
            type="submit" 
            className="submit-button"
            disabled={!userInput.trim() || isValidating || round.currentStep.isCompleted}
          >
            {isValidating ? 'Validating...' : 
             round.currentStep.isCompleted ? 'Completed' : 
             'Submit Answer'}
          </button>
        </form>

        {canProceed && countdown > 0 && (
          <div className="next-round-section">
            <div className="countdown">
              <p>Great job! You can proceed to the next round in {countdown} seconds.</p>
            </div>
          </div>
        )}

        {canProceed && countdown === 0 && (
          <div className="next-round-section">
            <button 
              className="next-round-button"
              onClick={handleNextRound}
            >
              {round.roundNumber >= 4 ? 'Complete Challenge' : 'Go to Next Round'}
            </button>
          </div>
        )}
      </div>

      <HintModal 
        isOpen={showHint}
        onClose={() => setShowHint(false)}
        teamId={teamId}
        roundNumber={round.roundNumber}
      />

      <SuccessModal 
        isOpen={showSuccess}
        onClose={() => setShowSuccess(false)}
        message={successMessage}
      />

      <ErrorModal 
        isOpen={showError}
        onClose={() => setShowError(false)}
        message={errorMessage}
      />
    </div>
  );
};

export default GameRound;

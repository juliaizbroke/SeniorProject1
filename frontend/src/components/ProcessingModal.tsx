import React, { useState, useEffect } from 'react';
import './ProcessingModal.css';

interface ProcessingModalProps {
  isVisible: boolean;
  title?: string;
  subtitle?: string;
}

const ProcessingModal: React.FC<ProcessingModalProps> = ({ 
  isVisible, 
  title = "Processing...", 
  subtitle = "Please wait while we process your file"
}) => {
  const [currentTipIndex, setCurrentTipIndex] = useState(0);
  const [fade, setFade] = useState(true);

  // User tips array - you can customize these
  const userTips = [
    {
      title: "📊 Question Types",
      content: "You can create Multiple Choice, True/False, Matching, Short Answer, and Long Answer questions all in one exam."
    },
    {
      title: "🖼️ Image Support", 
      content: "Add images to any question type to make your exams more engaging and visual."
    },
    {
      title: "🔀 Smart Shuffling",
      content: "Enable answer shuffling to automatically randomize multiple choice options for each exam generation."
    },
    {
      title: "📝 Template Flexibility",
      content: "Use different Word templates to match your institution's formatting requirements."
    },
    {
      title: "🎯 Duplicate Detection",
      content: "Our system automatically detects similar questions to help you maintain question bank quality."
    },
    {
      title: "📋 Category Organization",
      content: "Organize questions by categories and select specific amounts from each category for balanced exams."
    },
    {
      title: "🔢 Auto Numbering",
      content: "Questions are automatically numbered and parts are assigned Roman numerals (I, II, III, etc.)."
    },
    {
      title: "💾 Answer Keys",
      content: "Answer keys are automatically generated alongside your exam papers for easy grading."
    },
    {
      title: "⚡ Batch Processing",
      content: "Upload Excel files with hundreds of questions - our system processes them efficiently."
    },
    {
      title: "🎨 Professional Formatting",
      content: "Generated documents use professional formatting with proper spacing and alignment."
    },
    {
      title: "📊 Flexible Scoring",
      content: "Different question types have different point values: MC/TF (1pt), Short (2pts), Long (5pts), Matching (1pt each)."
    },
    {
      title: "🔄 Version Control",
      content: "Each exam generation creates a unique version, perfect for multiple exam sessions."
    }
  ];

  // Auto-advance tips every 10 seconds
  useEffect(() => {
    if (!isVisible) return;

    const interval = setInterval(() => {
      setFade(false);
      setTimeout(() => {
        setCurrentTipIndex((prev) => (prev + 1) % userTips.length);
        setFade(true);
      }, 200);
    }, 10000);

    return () => clearInterval(interval);
  }, [isVisible, userTips.length]);

  const goToPreviousTip = () => {
    setFade(false);
    setTimeout(() => {
      setCurrentTipIndex((prev) => (prev - 1 + userTips.length) % userTips.length);
      setFade(true);
    }, 200);
  };

  const goToNextTip = () => {
    setFade(false);
    setTimeout(() => {
      setCurrentTipIndex((prev) => (prev + 1) % userTips.length);
      setFade(true);
    }, 200);
  };

  if (!isVisible) return null;

  const currentTip = userTips[currentTipIndex];

  return (
    <div className="processing-modal-overlay">
      <div className="processing-modal">
        {/* Header */}
        <div className="processing-header">
          <div className="loading-spinner"></div>
          <div className="processing-text">
            <h2>{title}</h2>
            <p>{subtitle}</p>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="progress-container">
          <div className="progress-bar">
            <div className="progress-fill"></div>
          </div>
        </div>

        {/* Tips Section */}
        <div className="tips-section">
          <h3>💡 Did You Know?</h3>
          
          <div className="tip-container">
            <button 
              className="tip-nav-btn left" 
              onClick={goToPreviousTip}
              aria-label="Previous tip"
            >
              ←
            </button>
            
            <div className={`tip-content ${fade ? 'fade-in' : 'fade-out'}`}>
              <div className="tip-title">{currentTip.title}</div>
              <div className="tip-text">{currentTip.content}</div>
            </div>
            
            <button 
              className="tip-nav-btn right" 
              onClick={goToNextTip}
              aria-label="Next tip"
            >
              →
            </button>
          </div>

          {/* Tip Indicators */}
          <div className="tip-indicators">
            {userTips.map((_, index) => (
              <span
                key={index}
                className={`indicator ${index === currentTipIndex ? 'active' : ''}`}
                onClick={() => {
                  setFade(false);
                  setTimeout(() => {
                    setCurrentTipIndex(index);
                    setFade(true);
                  }, 200);
                }}
              />
            ))}
          </div>

          {/* Tip Counter */}
          <div className="tip-counter">
            {currentTipIndex + 1} of {userTips.length}
          </div>
        </div>

        {/* Fun fact at bottom */}
        <div className="fun-fact">
          <small>🚀 Processing typically takes 1-5 minutes depending on file size</small>
        </div>
      </div>
    </div>
  );
};

export default ProcessingModal;

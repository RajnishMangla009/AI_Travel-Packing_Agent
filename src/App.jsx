import React, { useState, useEffect } from 'react';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { generateDemoPlan } from './demoData';

export default function App() {
  // User input states
  const [destination, setDestination] = useState('');
  const [days, setDays] = useState(5);
  const [tripType, setTripType] = useState('Leisure');

  // Mode settings
  const [demoMode, setDemoMode] = useState(true);
  const [apiKey, setApiKey] = useState(() => {
    return localStorage.getItem('gemini_api_key') || '';
  });
  const [selectedModel, setSelectedModel] = useState(() => {
    return localStorage.getItem('gemini_selected_model') || 'gemini-1.5-flash';
  });
  const [showSettings, setShowSettings] = useState(false);

  // App UI states
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [rawTextOutput, setRawTextOutput] = useState('');
  const [parsedData, setParsedData] = useState(null);
  const [displayedSteps, setDisplayedSteps] = useState([]);
  const [isAnimating, setIsAnimating] = useState(false);
  const [showFinalPlan, setShowFinalPlan] = useState(false);

  // Packing checklist state (tracks items packed)
  const [packedItems, setPackedItems] = useState({});

  // Save API key to localStorage when changed
  const handleApiKeyChange = (e) => {
    const val = e.target.value;
    setApiKey(val);
    localStorage.setItem('gemini_api_key', val);
  };

  // Save model selection to localStorage when changed
  const handleModelChange = (e) => {
    const val = e.target.value;
    setSelectedModel(val);
    localStorage.setItem('gemini_selected_model', val);
  };

  // Helper to parse the strict output format
  const parsePackingPlan = (text) => {
    const lines = text.split('\n');
    const thinkingSteps = [];
    const mustPack = [];
    const optionalItems = [];
    const skipItems = [];
    const warnings = [];

    let currentSection = '';

    for (let line of lines) {
      const trimmedLine = line.trim();
      if (!trimmedLine) continue;

      const lowerLine = trimmedLine.toLowerCase();

      // Detect sections
      if (lowerLine.startsWith('thinking steps:')) {
        currentSection = 'thinking';
        continue;
      } else if (lowerLine.startsWith('final plan:')) {
        continue;
      } else if (lowerLine.startsWith('must pack:') || lowerLine.startsWith('must pack (high priority):')) {
        currentSection = 'must';
        continue;
      } else if (lowerLine.startsWith('optional items:') || lowerLine.startsWith('optional items (medium priority):')) {
        currentSection = 'optional';
        continue;
      } else if (lowerLine.startsWith('skip items:')) {
        currentSection = 'skip';
        continue;
      } else if (lowerLine.startsWith('warnings:') || lowerLine.startsWith('warnings / tips:')) {
        currentSection = 'warnings';
        continue;
      }

      // Parse line contents
      if (currentSection === 'thinking') {
        if (trimmedLine.startsWith('[') && trimmedLine.endsWith(']')) {
          const inner = trimmedLine.slice(1, -1);
          const colonIdx = inner.indexOf(':');
          if (colonIdx !== -1) {
            const stepName = inner.substring(0, colonIdx).trim();
            const stepVal = inner.substring(colonIdx + 1).trim();
            thinkingSteps.push({ name: stepName, value: stepVal });
          } else {
            thinkingSteps.push({ name: 'Reasoning', value: inner });
          }
        }
      } else if (currentSection === 'must') {
        if (trimmedLine.startsWith('-')) {
          const parts = trimmedLine.slice(1).split('|').map(p => p.trim());
          if (parts.length >= 1 && parts[0]) {
            mustPack.push({
              item: parts[0],
              reason: parts[1] || 'Essential trip requirement',
              priority: parts[2] || '9',
              confidence: parts[3] || 'High'
            });
          }
        }
      } else if (currentSection === 'optional') {
        if (trimmedLine.startsWith('-')) {
          const parts = trimmedLine.slice(1).split('|').map(p => p.trim());
          if (parts.length >= 1 && parts[0]) {
            optionalItems.push({
              item: parts[0],
              reason: parts[1] || 'Recommended item',
              priority: parts[2] || '6'
            });
          }
        }
      } else if (currentSection === 'skip') {
        if (trimmedLine.startsWith('-')) {
          const parts = trimmedLine.slice(1).split('|').map(p => p.trim());
          if (parts.length >= 1 && parts[0]) {
            skipItems.push({
              item: parts[0],
              reason: parts[1] || 'Not relevant for this trip type'
            });
          }
        }
      } else if (currentSection === 'warnings') {
        if (trimmedLine.startsWith('-') || trimmedLine.startsWith('*')) {
          warnings.push(trimmedLine.slice(1).trim());
        } else {
          warnings.push(trimmedLine);
        }
      }
    }

    return { thinkingSteps, mustPack, optionalItems, skipItems, warnings };
  };

  // Run typewriter animation on the thinking steps
  useEffect(() => {
    if (!parsedData || parsedData.thinkingSteps.length === 0) {
      setDisplayedSteps([]);
      return;
    }

    setDisplayedSteps([]);
    setIsAnimating(true);
    setShowFinalPlan(false);
    setPackedItems({}); // Reset checkboxes

    let currentStepIdx = 0;
    let currentCharIdx = 0;
    let currentText = '';

    const interval = setInterval(() => {
      if (currentStepIdx >= parsedData.thinkingSteps.length) {
        clearInterval(interval);
        setIsAnimating(false);
        setShowFinalPlan(true);
        return;
      }

      const step = parsedData.thinkingSteps[currentStepIdx];
      const fullText = `[${step.name}: ${step.value}]`;

      if (currentCharIdx < fullText.length) {
        currentText += fullText[currentCharIdx];
        setDisplayedSteps(prev => {
          const next = [...prev];
          next[currentStepIdx] = currentText;
          return next;
        });
        currentCharIdx++;
      } else {
        // Step completed, move to next step
        currentStepIdx++;
        currentCharIdx = 0;
        currentText = '';
      }
    }, 12); // Speed optimized for 40s hackathon demo (~4-5 seconds total thinking animation)

    return () => clearInterval(interval);
  }, [parsedData]);

  // Skip the typewriter animation directly to the final plan
  const handleSkipAnimation = () => {
    if (!parsedData) return;
    const completed = parsedData.thinkingSteps.map(step => `[${step.name}: ${step.value}]`);
    setDisplayedSteps(completed);
    setIsAnimating(false);
    setShowFinalPlan(true);
  };

  // Generate packing list handler
  const handleGenerate = async (e) => {
    e.preventDefault();
    if (!destination.trim()) {
      setError('Please provide a destination.');
      return;
    }

    setError('');
    setIsLoading(true);
    setParsedData(null);
    setRawTextOutput('');

    if (demoMode) {
      // Simulate quick latency and use dynamic templated plan
      setTimeout(() => {
        const demoOutput = generateDemoPlan(destination, days, tripType);
        setRawTextOutput(demoOutput);
        setParsedData(parsePackingPlan(demoOutput));
        setIsLoading(false);
      }, 700);
    } else {
      // Live AI call mode
      if (!apiKey) {
        setError('Please enter a Gemini API Key in the settings panel to run in Live AI mode, or toggle Demo Mode back on.');
        setIsLoading(false);
        return;
      }

      try {
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: selectedModel });

        const prompt = `
You are an intelligent AI Travel Packing Agent.
You MUST behave like a decision-making system, not a chatbot.
Your task is to simulate step-by-step reasoning and generate a structured packing plan.

User Input:
Destination: ${destination}
Days: ${days}
Trip Type: ${tripType}

Follow these steps internally and SHOW them:
1. Analyze the destination
2. Estimate weather conditions (no real data, assume logically)
3. Understand the trip type
4. Infer likely activities
5. Detect possible risks
6. Decide and prioritize packing items

Output Format (STRICT):

Thinking Steps:
[Analyzing destination: <one sentence dynamic analysis>]
[Estimating weather: <one sentence estimated temperatures and forecast>]
[Understanding trip type: <one sentence context on trip profile>]
[Inferring activities: <one sentence list of key activities>]
[Detecting risks: <one sentence key risks to mitigate>]
[Prioritizing items: <one sentence prioritization rationale>]

Final Plan:

Must Pack:
- Item | Reason | Priority Score (1-10) | Confidence (Low/Medium/High)

Optional Items:
- Item | Reason | Priority Score (1-10)

Skip Items:
- Item | Reason

Warnings:
- Bullet points based on risks, weather, and trip type

Rules:
- Keep output concise
- No long paragraphs
- No storytelling
- No extra explanation outside format
- Think like an agent making decisions, not a chatbot answering questions
`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        setRawTextOutput(text);
        setParsedData(parsePackingPlan(text));
      } catch (err) {
        console.error(err);
        let errMsg = err.message || '';
        if (errMsg.includes('404') && errMsg.includes('not found')) {
          setError(`AI Generation Failed: Model "${selectedModel}" not found. Try switching to a different model in settings (e.g. "gemini-1.5-flash-latest", "gemini-2.0-flash", or "gemini-2.5-flash").`);
        } else {
          setError('AI Generation Failed: ' + (errMsg || 'Check your internet connection and API key.'));
        }
      } finally {
        setIsLoading(false);
      }
    }
  };

  // Toggle item packing status
  const togglePacked = (itemName) => {
    setPackedItems(prev => ({
      ...prev,
      [itemName]: !prev[itemName]
    }));
  };

  // Calculation for progress bar
  const totalMustPackItems = parsedData ? parsedData.mustPack.length : 0;
  const packedMustPackItemsCount = parsedData ? parsedData.mustPack.filter(item => packedItems[item.item]).length : 0;
  const progressPercent = totalMustPackItems > 0 ? Math.round((packedMustPackItemsCount / totalMustPackItems) * 100) : 0;

  return (
    <div className="app-container">
      <header>
        <h1>AI Travel Packing Agent</h1>
        <p className="subtitle">Agentic Decision-Making Packing Assistant</p>
      </header>

      <main className="main-grid">
        {/* Left Control Panel */}
        <section className="panel">
          <div className="panel-title">
            <span>⚙️</span> Trip Configuration
          </div>

          <form onSubmit={handleGenerate}>
            <div className="form-group">
              <label htmlFor="destination">Destination</label>
              <input
                id="destination"
                type="text"
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                placeholder="e.g., Paris, Hawaii, Iceland, Tokyo"
                required
              />
              {demoMode && (
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem', display: 'block' }}>
                  Supported presets: <b>Paris</b>, <b>Hawaii</b>, <b>Iceland</b> (fallback: Tokyo)
                </span>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="days">Days of Trip</label>
              <input
                id="days"
                type="number"
                min="1"
                max="90"
                value={days}
                onChange={(e) => setDays(parseInt(e.target.value) || 1)}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="tripType">Trip Type</label>
              <select
                id="tripType"
                value={tripType}
                onChange={(e) => setTripType(e.target.value)}
              >
                <option value="Leisure">Leisure / Vacation</option>
                <option value="Business">Business</option>
                <option value="Adventure">Adventure / Hiking</option>
                <option value="Beach">Beach Holiday</option>
              </select>
            </div>

            <button type="submit" className="btn-primary" disabled={isLoading}>
              {isLoading ? (
                <>⏳ Analyzing Trip...</>
              ) : (
                <>🚀 Run Agent Reasoning</>
              )}
            </button>
          </form>

          {/* Settings Panel */}
          <div className="api-settings">
            <div className="toggle-container">
              <label htmlFor="demoModeToggle" style={{ margin: 0, cursor: 'pointer' }}>Demo Mode (Instant, No Key)</label>
              <label className="switch">
                <input
                  id="demoModeToggle"
                  type="checkbox"
                  checked={demoMode}
                  onChange={(e) => setDemoMode(e.target.checked)}
                />
                <span className="slider"></span>
              </label>
            </div>

            <div style={{ textAlign: 'right' }}>
              <button 
                type="button" 
                onClick={() => setShowSettings(!showSettings)} 
                className="tab-btn"
                style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}
              >
                {showSettings ? 'Hide Settings 🔑' : 'Configure API Key & Model 🔑'}
              </button>
            </div>

            {showSettings && (
              <div className="api-key-input" style={{ marginTop: '0.75rem' }}>
                <div className="form-group">
                  <label htmlFor="apiKey">Gemini API Key</label>
                  <input
                    id="apiKey"
                    type="password"
                    value={apiKey}
                    onChange={handleApiKeyChange}
                    placeholder="AIzaSy..."
                  />
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label htmlFor="modelSelect">Gemini Model</label>
                  <select
                    id="modelSelect"
                    value={selectedModel}
                    onChange={handleModelChange}
                  >
                    <option value="gemini-1.5-flash">gemini-1.5-flash</option>
                    <option value="gemini-1.5-flash-latest">gemini-1.5-flash-latest</option>
                    <option value="gemini-2.0-flash">gemini-2.0-flash</option>
                    <option value="gemini-2.5-flash">gemini-2.5-flash</option>
                    <option value="gemini-1.5-pro">gemini-1.5-pro</option>
                  </select>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.25rem', display: 'block' }}>
                    Select a model that is available in your Google AI Studio project region.
                  </span>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Right Output Area */}
        <section className="results-container">
          {error && (
            <div className="warnings-list" style={{ color: 'var(--accent-danger)', backgroundColor: 'rgba(239,68,68,0.08)', border: '1px solid var(--accent-danger)' }}>
              ⚠️ {error}
            </div>
          )}

          {/* Terminal Screen for Agent Thinking */}
          {(isLoading || displayedSteps.length > 0) && (
            <div className="terminal">
              <div className="terminal-header">
                <div className="terminal-dots">
                  <div className="terminal-dot dot-red"></div>
                  <div className="terminal-dot dot-yellow"></div>
                  <div className="terminal-dot dot-green"></div>
                </div>
                <div className="terminal-title">Agent Logic Terminal</div>
                {isAnimating && (
                  <button onClick={handleSkipAnimation} className="tab-btn" style={{ fontSize: '0.7rem', padding: '2px 8px', margin: 0 }}>
                    ⚡ Skip
                  </button>
                )}
              </div>

              {isLoading && displayedSteps.length === 0 && (
                <div className="terminal-line">
                  <span className="terminal-prefix">agent@travel-packing:~$ </span>
                  <span className="terminal-text">Spinning up decision-making loops...</span>
                  <span className="terminal-cursor"></span>
                </div>
              )}

              {displayedSteps.map((step, idx) => (
                <div key={idx} className="terminal-line">
                  <span className="terminal-prefix">agent@travel-packing:~$ </span>
                  <span className="terminal-text">{step}</span>
                  {idx === displayedSteps.length - 1 && isAnimating && <span className="terminal-cursor"></span>}
                </div>
              ))}
            </div>
          )}

          {/* Final Plan Presentation */}
          {showFinalPlan && parsedData && (
            <div className="plan-container">
              {/* Packing Checklist Progress */}
              <div className="packing-progress">
                <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>Must Pack Checklist</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                    {packedMustPackItemsCount} of {totalMustPackItems} packed
                  </span>
                  <div className="progress-track">
                    <div className="progress-fill" style={{ width: `${progressPercent}%` }}></div>
                  </div>
                </div>
              </div>

              {/* Must Pack Items */}
              {parsedData.mustPack.length > 0 && (
                <div className="plan-section">
                  <div className="section-title title-must">🔴 Must Pack (High Priority)</div>
                  <div className="items-list">
                    {parsedData.mustPack.map((item, idx) => (
                      <div key={idx} className="item-card">
                        <div className="item-left">
                          <input
                            type="checkbox"
                            className="item-checkbox"
                            checked={!!packedItems[item.item]}
                            onChange={() => togglePacked(item.item)}
                          />
                          <div className="item-info">
                            <span className={`item-name ${packedItems[item.item] ? 'packed' : ''}`}>
                              {item.item}
                            </span>
                            <span className="item-reason">{item.reason}</span>
                          </div>
                        </div>
                        <div className="item-meta">
                          <span className="badge badge-priority">Priority: {item.priority}</span>
                          <span className={`badge badge-confidence-${item.confidence.toLowerCase()}`}>
                            Conf: {item.confidence}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Optional Items */}
              {parsedData.optionalItems.length > 0 && (
                <div className="plan-section">
                  <div className="section-title title-optional">🟡 Optional Items (Medium Priority)</div>
                  <div className="items-list">
                    {parsedData.optionalItems.map((item, idx) => (
                      <div key={idx} className="item-card">
                        <div className="item-left">
                          <div className="item-info">
                            <span className="item-name">{item.item}</span>
                            <span className="item-reason">{item.reason}</span>
                          </div>
                        </div>
                        <div className="item-meta">
                          <span className="badge badge-priority">Priority: {item.priority}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Skip Items */}
              {parsedData.skipItems.length > 0 && (
                <div className="plan-section">
                  <div className="section-title title-skip">⚪ Skip Items</div>
                  <div className="items-list">
                    {parsedData.skipItems.map((item, idx) => (
                      <div key={idx} className="item-card skip-card">
                        <span className="item-name" style={{ color: 'var(--text-secondary)' }}>
                          {item.item}
                        </span>
                        <span className="skip-reason">Reason: {item.reason}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Warnings / Tips */}
              {parsedData.warnings.length > 0 && (
                <div className="plan-section">
                  <div className="section-title title-warnings">💡 Trip Guidance & Warnings</div>
                  <ul className="warnings-list">
                    {parsedData.warnings.map((tip, idx) => (
                      <li key={idx}>{tip}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* Initial state placeholder */}
          {!isLoading && displayedSteps.length === 0 && (
            <div className="panel flex-center" style={{ minHeight: '200px', flexDirection: 'column', color: 'var(--text-secondary)' }}>
              <span style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>🧳</span>
              <p style={{ textAlign: 'center', fontSize: '0.95rem' }}>
                Fill in the details on the left and run the agent to simulate decision making and compile your packing plan.
              </p>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

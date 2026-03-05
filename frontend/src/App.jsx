import React, { useState } from 'react';
import HTMLFlipBook from 'react-pageflip';
import './App.css';

function App() {
  const [childName, setChildName] = useState('Anushka');
  const [age, setAge] = useState('7');
  const [condition, setCondition] = useState('Asthma');

  const [storybook, setStorybook] = useState(null);
  const [loading, setLoading] = useState(false);

  const generateStory = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('http://localhost:8000/generate-storybook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          child_name: childName,
          age: parseInt(age),
          condition: condition
        })
      });

      const data = await response.json();

      const storyPages = data.story
        .split('---')
        .map(page => page.trim())
        .filter(page => page.length > 0);

      setStorybook({
        texts: storyPages,
        images: data.images
      });
    } catch (error) {
      console.error("Error generating story:", error);
      alert("Failed to generate the storybook. Check if FastAPI is running!");
    }
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="app-container centered">
        <div className="form-card">
          <h2>Writing and Illustrating...</h2>
          <p>Crafting a magical story for {childName}. This might take a minute.</p>
        </div>
      </div>
    );
  }

  if (!storybook) {
    return (
      <div className="app-container centered">
        <div className="form-card">
          <h1>Cartoon Care</h1>
          <p>AI-Generated Medical Storybooks</p>
          
          <form onSubmit={generateStory} className="story-form">
            <div className="input-group">
              <label>Child's Name</label>
              <input 
                type="text" 
                value={childName} 
                onChange={(e) => setChildName(e.target.value)} 
                required 
              />
            </div>
            
            <div className="input-group">
              <label>Age</label>
              <input 
                type="number" 
                value={age} 
                onChange={(e) => setAge(e.target.value)} 
                required 
              />
            </div>

            <div className="input-group">
              <label>Condition</label>
              <input 
                type="text" 
                value={condition} 
                onChange={(e) => setCondition(e.target.value)} 
                required 
              />
            </div>

            <button type="submit" className="generate-btn">Create Interactive Book</button>
          </form>
        </div>
      </div>
    );
  }

  // --- THE FIX: Create a flat array of pages so react-pageflip can see them ---
  const bookPages = [];

  // 1. Front Cover (Because showCover={true}, this starts on the RIGHT side)
  bookPages.push(
    <div key="front-cover" className="page page-cover front-cover-bg">
      <div className="page-content center-content">
        <h2>{childName}'s Brave Journey</h2>
        <p className="subtitle">A special story about {condition}</p>
        <p className="swipe-hint">Click or drag the corner to open &rarr;</p>
      </div>
    </div>
  );

  // 2. Inner Pages (Image on Left, Text on Right)
  storybook.texts.forEach((text, index) => {
    // Left Page: Image
    bookPages.push(
      <div key={`img-${index}`} className="page image-page">
        <div className="page-content image-content">
          <img 
            src={`http://localhost:8000/${storybook.images[index]}`} 
            alt={`Illustration ${index + 1}`} 
          />
        </div>
      </div>
    );

    // Right Page: Text
    bookPages.push(
      <div key={`txt-${index}`} className="page text-page">
        <div className="page-content text-content">
          <p className="story-text">{text}</p>
          <div className="page-number">- {index + 1} -</div>
        </div>
      </div>
    );
  });

  // 3. Back Cover (This will land on the LEFT side)
  bookPages.push(
    <div key="back-cover" className="page page-cover back-cover-bg">
      <div className="page-content center-content">
        <h2>The End</h2>
        <button className="reset-btn" onClick={() => setStorybook(null)}>
          Create Another Book
        </button>
      </div>
    </div>
  );

  return (
    <div className="app-container centered">
      <HTMLFlipBook 
        width={450} 
        height={600} 
        size="fixed"
        minWidth={315}
        maxWidth={1000}
        minHeight={400}
        maxHeight={1533}
        showCover={true}
        drawShadow={true}
        flippingTime={1000}
        className="my-flipbook"
      >
        {/* Pass the flat array directly here! */}
        {bookPages}
      </HTMLFlipBook>
    </div>
  );
}

export default App;
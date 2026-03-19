import HTMLFlipBook from "react-pageflip";
import "./StoryBook.css";

function StoryBook({ story, images }) {

  const pages = story.split("---").filter(p => p.trim() !== "");

  return (
    <div className="book-wrapper">
      <HTMLFlipBook
        width={900}
        height={600}
        size="fixed"
        minWidth={800}
        maxWidth={1000}
        showCover={true}
        className="flip-book"
      >

        {/* Cover */}
        <div className="page cover">
          <h1>Cartoon Care</h1>
          <p>A Magical Story ✨</p>
        </div>

        {pages.map((text, index) => (
          <div key={index} className="page book-page">
            
            {/* LEFT SIDE - IMAGE */}
            <div className="left-page">
              <img
                src={`http://localhost:8000/${images[index]}`}
                alt="story"
              />
            </div>

            {/* RIGHT SIDE - TEXT */}
            <div className="right-page">
              <p>{text}</p>
            </div>

          </div>
        ))}

        {/* Ending */}
        <div className="page cover">
          <h2>The End 💖</h2>
        </div>

      </HTMLFlipBook>
    </div>
  );
}

export default StoryBook;


export default function Header({ username }: any) {
    return (
      <header className="top-bar">
        <div className="header-left">
          {/* Renders: Hello, Aditya (or whatever you logged in as) */}
          <h1 className="greeting">Hello, <span>{username}</span></h1>
        </div>
        <div className="search-container">
          <input type="text" placeholder="Search tasks..." />
        </div>
      </header>
    );
}

export default function Header({ username, searchQuery, setSearchQuery }: any) {
    return (
      <header className="top-bar">
        <div className="header-left">
          <h1 className="greeting">Hello, <span>{username}</span></h1>
        </div>
        <div className="search-container">
          <input 
            type="text" 
            placeholder="Search tasks..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </header>
    );
}
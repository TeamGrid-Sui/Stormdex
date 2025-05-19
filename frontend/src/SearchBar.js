import React, { useState, useEffect, useRef } from 'react';
import './Stormdex.css'; // Import the CSS file for styling

const SearchBar = () => {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const searchRef = useRef(null);

  // Handle clicks outside to close the dropdown and clear the search
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowDropdown(false);
        setQuery('');
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Debounce search and fetch data when query changes
  useEffect(() => {
    const debounceSearch = setTimeout(() => {
      if (query.length >= 3) {
        fetchSearchResults(query);
      } else {
        setResults([]);
        setShowDropdown(false);
      }
    }, 300); // 300ms debounce delay
    return () => clearTimeout(debounceSearch);
  }, [query]);

  // Fetch search results from GeckoTerminal API
  const fetchSearchResults = async (searchQuery) => {
    setLoading(true);
    try {
      const response = await fetch(
        `https://api.geckoterminal.com/api/v2/search/pools?query=${encodeURIComponent(
          searchQuery
        )}&network=sui-network&include=base_token&page=1`
      );
      const data = await response.json();
      setResults(data.included || []);
      setShowDropdown(true);
    } catch (error) {
      console.error('Error fetching search results:', error);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  // Handle image load errors
  const handleImageError = (e) => {
    e.target.style.display = 'none'; // Hide broken images
  };

  return (
    <div className="search-bar" ref={searchRef}>
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search tokens..."
        onFocus={() => query.length >= 3 && setShowDropdown(true)}
      />
      {showDropdown && (
        <div className="search-dropdown">
          {loading ? (
            <div className="loading-spinner">Loading...</div>
          ) : results.length > 0 ? (
            results.map((token) => (
              <div key={token.id} className="search-result">
                {token.attributes.image_url ? (
                  <img
                    src={token.attributes.image_url}
                    alt={token.attributes.name}
                    className="token-icon"
                    onError={handleImageError}
                  />
                ) : (
                  <div className="token-letter-icon">
                    {token.attributes.name
                      ? token.attributes.name.charAt(0).toUpperCase()
                      : '?'}
                  </div>
                )}
                <span className="token-name">{token.attributes.name}</span>
                <span className="token-address">{token.attributes.address}</span>
              </div>
            ))
          ) : (
            <div className="no-results">No results found</div>
          )}
        </div>
      )}
    </div>
  );
};

export default SearchBar;
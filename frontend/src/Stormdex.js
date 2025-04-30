import React, { useState, useEffect } from 'react';
import './Stormdex.css';

// Utility function to calculate time ago
const timeAgo = (dateString) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now - date) / 1000);

  if (diffInSeconds < 60) return `${diffInSeconds}s`;
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) return `${diffInMinutes}m`;
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours}h`;
  const diffInDays = Math.floor(diffInHours / 24);
  return `${diffInDays}d`;
};

// Utility function to format FDV (MCAP)
const formatFDV = (fdv) => {
  if (!fdv) return 'N/A';
  const num = parseFloat(fdv);
  if (num >= 1e6) return `$${(num / 1e6).toFixed(1)}M`;
  if (num >= 1e3) return `$${(num / 1e3).toFixed(1)}K`;
  return `$${num.toFixed(0)}`;
};

// Utility function to format SUPPLY based on decimals
const formatSupply = (decimals) => {
  if (!decimals && decimals !== 0) return 'N/A';
  const value = Math.pow(10, decimals);
  if (decimals === 0) return '10';
  if (decimals === 3) return '1K';
  if (decimals === 4) return '10K';
  if (decimals === 5) return '100K';
  if (decimals === 6) return '1M';
  if (decimals === 7) return '10M';
  if (decimals === 8) return '100M';
  if (decimals === 9) return '1B';
  return `10^${decimals}`; // Fallback for other values
};

function Stormdex({ openNav, closeNav, isSidenavOpen, curiosityButtonRef }) {
  const [pools, setPools] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      // Fetch page 1
      const response1 = await fetch(
        'https://api.geckoterminal.com/api/v2/networks/sui-network/new_pools?include=base_token&page=1',
        {
          headers: {
            'Accept': 'application/json',
          },
        }
      );
      const data1 = await response1.json();

      // Fetch page 2
      const response2 = await fetch(
        'https://api.geckoterminal.com/api/v2/networks/sui-network/new_pools?include=base_token&page=2',
        {
          headers: {
            'Accept': 'application/json',
          },
        }
      );
      const data2 = await response2.json();

      // Combine pool data
      const poolData = [...data1.data, ...data2.data];

      // Combine and deduplicate included tokens by id
      const includedMap = new Map();
      [...(data1.included || []), ...(data2.included || [])].forEach((item) => {
        if (item.type === 'token') {
          includedMap.set(item.id, item);
        }
      });
      const included = Array.from(includedMap.values());

      // Create a map of token IDs to token data
      const tokenMap = {};
      included.forEach((item) => {
        if (item.type === 'token') {
          tokenMap[item.id] = {
            image_url: item.attributes.image_url,
            decimals: item.attributes.decimals,
            name: item.attributes.name || item.attributes.symbol || 'Unknown',
          };
        }
      });

      // Map pool data to table rows
      const mappedPools = poolData.map((pool) => {
        const tokenId = pool.relationships.base_token.data.id;
        const tokenData = tokenMap[tokenId] || {};
        const imageUrl = tokenData.image_url || null;
        const name = pool.attributes.name.split(' ')[0]; // First part of name
        const createdAt = timeAgo(pool.attributes.pool_created_at);
        const fdv = formatFDV(pool.attributes.fdv_usd);
        const buysSells = `${pool.attributes.transactions.h24.buys} / ${pool.attributes.transactions.h24.sells}`;
        const vol24h = `${pool.attributes.price_change_percentage.h24}%`;
        const supply = formatSupply(tokenData.decimals);
        const tokenName = tokenData.name; // For letter icon

        return {
          name,
          imageUrl,
          createdAt,
          fdv,
          buysSells,
          vol24h,
          supply,
          tokenName,
        };
      });

      setPools(mappedPools);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching data:', error);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData(); // Initial fetch
    const interval = setInterval(fetchData, 10000); // Refresh every 10 seconds

    return () => clearInterval(interval); // Clear interval on unmount
  }, []);

  const handleCuriosityClick = () => {
    if (isSidenavOpen) {
      closeNav();
    } else {
      openNav();
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="stormdex">
      {/* Curiosity Button */}
      <div className="table-controls">
        <button
          className="curiosity-button"
          onClick={handleCuriosityClick}
          ref={curiosityButtonRef}
        >
          Curiosity
        </button>
      </div>

      {/* Stormdex Table */}
      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>TOKEN</th>
              <th>CREATED</th>
              <th>MCAP</th>
              <th>LIQUIDITY</th>
              <th>SUPPLY</th>
              <th>BUYS/SELLS</th>
              <th>VOL. (24H)</th>
            </tr>
          </thead>
          <tbody>
            {pools.map((pool, index) => (
              <React.Fragment key={index}>
                <tr>
                  <td data-label="TOKEN">
                    {pool.imageUrl ? (
                      <img src={pool.imageUrl} alt={pool.name} className="token-icon" />
                    ) : (
                      <div className="token-letter-icon">
                        {pool.tokenName ? pool.tokenName.charAt(0).toUpperCase() : '?'}
                      </div>
                    )}
                    {pool.name}
                  </td>
                  <td data-label="CREATED">{pool.createdAt}</td>
                  <td data-label="MCAP">{pool.fdv}</td>
                  <td data-label="LIQUIDITY">
                    {/* Placeholder for future implementation */}
                  </td>
                  <td data-label="SUPPLY">{pool.supply}</td>
                  <td data-label="BUYS/SELLS">{pool.buysSells}</td>
                  <td
                    data-label="VOL. (24H)"
                    className={pool.vol24h.startsWith('-') ? 'negative' : 'positive'}
                  >
                    {pool.vol24h}
                  </td>
                </tr>
                <tr>
                  <td></td>
                  <td></td>
                  <td></td>
                  <td data-label="Status" className="status">LOCKED</td>
                  <td data-label="Audit" className="status">MAD</td>
                  <td data-label="Security" className="status">NOT HONEYPOT</td>
                  <td></td>
                </tr>
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default Stormdex;
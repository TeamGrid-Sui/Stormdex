import React, { useState, useEffect } from 'react';
import './Sidenav.css';

function Sidenav({ isOpen, closeNav, sidenavRef }) {
  const [loadingTokens, setLoadingTokens] = useState(true);
  const [loadingTrades, setLoadingTrades] = useState(false);
  const [token, setToken] = useState(null);
  const [buyers, setBuyers] = useState([]);
  const [sellers, setSellers] = useState([]);
  const [transactions, setTransactions] = useState([]);

  const fetchTokens = async () => {
    try {
      const response1 = await fetch('https://api.geckoterminal.com/api/v2/networks/sui-network/new_pools?include=base_token&page=1');
      const data1 = await response1.json();
      const response2 = await fetch('https://api.geckoterminal.com/api/v2/networks/sui-network/new_pools?include=base_token&page=2');
      const data2 = await response2.json();
      const allTokens = [...data1.data, ...data2.data];

      const tokenMap = {};
      [...(data1.included || []), ...(data2.included || [])].forEach(item => {
        if (item.type === 'token') {
          tokenMap[item.id] = {
            image_url: item.attributes.image_url,
            name: item.attributes.name || item.attributes.symbol || 'Unknown',
          };
        }
      });

      const filteredTokens = allTokens.filter(token => {
        const buys = token.attributes.transactions.h24.buys;
        return buys >= 50 && buys < 300;
      });

      if (filteredTokens.length === 0) return null;

      const randomIndex = Math.floor(Math.random() * filteredTokens.length);
      const selectedToken = filteredTokens[randomIndex];

      const tokenId = selectedToken.relationships.base_token.data.id;
      selectedToken.attributes.image_url = tokenMap[tokenId]?.image_url || '';
      selectedToken.attributes.name = tokenMap[tokenId]?.name || 'Unknown';

      return selectedToken;
    } catch (error) {
      console.error('Error fetching tokens:', error);
      return null;
    }
  };

  const fetchTrades = async (address) => {
    try {
      const response = await fetch(`https://api.geckoterminal.com/api/v2/networks/sui-network/pools/${address}/trades?trade_volume_in_usd_greater_than=0&token=base`);
      const data = await response.json();
      // Extract all transactions
      const allTransactions = data.data.map(trade => ({
        address: trade.attributes.tx_from_address,
        volume_in_usd: trade.attributes.volume_in_usd,
        kind: trade.attributes.kind,
        block_timestamp: trade.attributes.block_timestamp,
      }));
      // Filter buyers and sellers for existing sections
      const buyers = allTransactions.filter(trade => trade.kind === 'buy');
      const sellers = allTransactions.filter(trade => trade.kind === 'sell');
      return { buyers, sellers, transactions: allTransactions };
    } catch (error) {
      console.error('Error fetching trades:', error);
      return { buyers: [], sellers: [], transactions: [] };
    }
  };

  useEffect(() => {
    sessionStorage.removeItem('sidebarData');
  }, []);

  useEffect(() => {
    const loadData = async () => {
      const storedData = sessionStorage.getItem('sidebarData');
      if (storedData) {
        const { token, buyers, sellers, transactions } = JSON.parse(storedData);
        setToken(token);
        setBuyers(buyers);
        setSellers(sellers);
        setTransactions(transactions);
        setLoadingTokens(false);
      } else {
        setLoadingTokens(true);
        const selectedToken = await fetchTokens();
        if (selectedToken) {
          setToken(selectedToken);
          setLoadingTokens(false);
          setLoadingTrades(true);
          const { buyers, sellers, transactions } = await fetchTrades(selectedToken.attributes.address);
          setBuyers(buyers);
          setSellers(sellers);
          setTransactions(transactions);
          setLoadingTrades(false);
          sessionStorage.setItem('sidebarData', JSON.stringify({ token: selectedToken, buyers, sellers, transactions }));
        } else {
          setLoadingTokens(false);
        }
      }
    };
    if (isOpen) loadData();
  }, [isOpen]);

  const handleImageError = (e) => {
    e.target.src = 'https://via.placeholder.com/40';
  };

  const truncateTokenName = (name) => {
    if (name.length <= 5) return name;
    return name.slice(0, -5);
  };

  // Aggregate transactions by address for Transaction History
  const aggregatedTransactions = transactions
    .sort((a, b) => new Date(a.block_timestamp) - new Date(b.block_timestamp))
    .reduce((acc, tx) => {
      if (!acc[tx.address]) {
        acc[tx.address] = [];
      }
      acc[tx.address].push({
        amount: tx.volume_in_usd,
        kind: tx.kind,
      });
      return acc;
    }, {});

  const transactionList = Object.entries(aggregatedTransactions).map(([address, txs]) => ({
    address,
    amounts: txs.map(tx => (tx.kind === 'buy' ? `+${tx.amount}` : `-${tx.amount}`)).join(''),
  }));

  // Aggregate transactions by address for Top Holders
  const topHolders = Object.entries(
    transactions.reduce((acc, tx) => {
      if (!acc[tx.address]) {
        acc[tx.address] = 0;
      }
      const amount = parseFloat(tx.volume_in_usd);
      acc[tx.address] += tx.kind === 'buy' ? amount : -amount;
      return acc;
    }, {})
  ).map(([address, netAmount]) => ({
    address,
    netAmount: Math.round(netAmount), // Round to nearest integer
  }));

  // Sort top holders: positive amounts descending, then negative amounts descending
  const sortedTopHolders = topHolders.sort((a, b) => {
    if (a.netAmount >= 0 && b.netAmount >= 0) return b.netAmount - a.netAmount;
    if (a.netAmount < 0 && b.netAmount < 0) return b.netAmount - a.netAmount;
    return b.netAmount - a.netAmount; // Positive above negative
  });

  return (
    <div id="mySidenav" className={`sidenav ${isOpen ? 'open' : ''}`} ref={sidenavRef}>
      <a
        href="#"
        className="closebtn"
        onClick={(e) => {
          e.preventDefault();
          closeNav();
        }}
      >
        ×
      </a>
      <div className="sidenav-content">
        {loadingTokens ? (
          <div className="radar-loading">
            <div className="radar"></div>
            <p>Fetching Tokens...</p>
          </div>
        ) : token ? (
          <>
            <div className="token-header">
              {token.attributes.image_url ? (
                <img
                  src={token.attributes.image_url}
                  alt={token.attributes.name}
                  className="token-logo"
                  onError={handleImageError}
                />
              ) : (
                <div className="token-placeholder">?</div>
              )}
              <h3>{truncateTokenName(token.attributes.name)}</h3>
            </div>
            {loadingTrades ? (
              <div className="radar-loading">
                <div className="radar"></div>
                <p>Fetching Transactions...</p>
              </div>
            ) : (
              <>
                <div className="transaction-columns">
                  <div className="buyers-column">
                    <h4>Buyers ({buyers.length})</h4>
                    <div className="address-list buyers">
                      {buyers.map((buyer, index) => (
                        <p className="address" key={index}>{buyer.address}</p>
                      ))}
                    </div>
                  </div>
                  <div className="vertical-line"></div>
                  <div className="sellers-column">
                    <h4>Sellers ({sellers.length})</h4>
                    <div className="address-list sellers">
                      {sellers.map((seller, index) => (
                        <p className="address" key={index}>{seller.address}</p>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="transaction-history">
                  <h4>Transaction History</h4>
                  <div className="transaction-list">
                    {transactionList.map((item, index) => (
                      <p className="transaction-item" key={index}>
                        {item.address} = {item.amounts}
                      </p>
                    ))}
                  </div>
                </div>
                <div className="top-holders">
                  <h4>Top Holders</h4>
                  <div className="holders-list">
                    {sortedTopHolders.map((holder, index) => (
                      <p className="holder-item" key={index}>
                        {holder.address} = {holder.netAmount}
                      </p>
                    ))}
                  </div>
                </div>
              </>
            )}
          </>
        ) : (
          <p>No suitable tokens found.</p>
        )}
      </div>
    </div>
  );
}

export default Sidenav;
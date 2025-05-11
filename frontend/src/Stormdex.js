import React, { useState, useEffect } from 'react';
import './Stormdex.css';
import { useWallet } from '@suiet/wallet-kit';
import { Transaction } from '@mysten/sui/transactions';
import { createSuiClient } from '@shinami/clients/sui';
import Chart from 'react-apexcharts';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCopy } from '@fortawesome/free-solid-svg-icons';

// Shinami Node Service setup (unchanged)
const SHINAMI_NODE_ACCESS_KEY = process.env.REACT_APP_SHINAMI_NODE_KEY;
if (!SHINAMI_NODE_ACCESS_KEY) {
  console.error('Shinami Node API key is missing. Please set REACT_APP_SHINAMI_NODE_KEY in .env');
  throw new Error('Shinami Node API key is missing');
}
const nodeClient = createSuiClient(SHINAMI_NODE_ACCESS_KEY);

// Utility functions
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

const formatFDV = (fdv) => {
  if (!fdv) return 'N/A';
  const num = parseFloat(fdv);
  if (num >= 1e6) return `$${(num / 1e6).toFixed(1)}M`;
  if (num >= 1e3) return `$${(num / 1e3).toFixed(1)}K`;
  return `$${num.toFixed(0)}`;
};

const formatLiquidity = (liquidity) => {
  if (!liquidity) return 'N/A';
  const num = parseFloat(liquidity);
  if (num >= 1e9) return `$${(num / 1e9).toFixed(1)}B`;
  if (num >= 1e6) return `$${(num / 1e6).toFixed(1)}M`;
  if (num >= 1e3) return `$${(num / 1e3).toFixed(1)}K`;
  return `$${num.toFixed(0)}`;
};

const formatVolume = (volume) => {
  if (!volume) return 'N/A';
  const num = parseFloat(volume);
  if (num >= 1e9) return `$${(num / 1e9).toFixed(1)}B`;
  if (num >= 1e6) return `$${(num / 1e6).toFixed(1)}M`;
  if (num >= 1e3) return `$${(num / 1e3).toFixed(1)}K`;
  return `$${num.toFixed(0)}`;
};

const formatSupply = (decimals) => {
  if (!decimals && decimals !== 0) return 'N/A';
  if (decimals === 0) return '10';
  if (decimals === 3) return '1K';
  if (decimals === 4) return '10K';
  if (decimals === 5) return '100K';
  if (decimals === 6) return '1M';
  if (decimals === 7) return '10M';
  if (decimals === 8) return '100M';
  if (decimals === 9) return '1B';
  return `10^${decimals}`;
};

// Smart contract details (unchanged)
const PACKAGE_ID = '0x96c9f8a44996202c76c9409714ff3004eaea0b48cc0e01962c00491cecfeff58';
const REGISTRY_ID = '0x73b8026c23df9ab670f867b03339023793a40285e0094b1b2a1dede6063bf31c';
const DEPOSIT_AMOUNT = 10_000_000; // 0.01 SUI in MIST

// TokenChart Component (unchanged)
const TokenChart = ({ address }) => {
  const [ohlcv, setOhlcv] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOhlcv = async () => {
      setLoading(true);
      try {
        const response = await fetch(
          `https://api.geckoterminal.com/api/v2/networks/sui-network/pools/${address}/ohlcv/minute?aggregate=1&limit=100¤cy=usd&token=base`
        );
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        const ohlcvList = data.data.attributes.ohlcv_list;
        if (!ohlcvList || ohlcvList.length === 0) {
          throw new Error('No OHLCV data available');
        }
        const formattedData = ohlcvList.map((item) => ({
          x: new Date(item[0] * 1000),
          y: [parseFloat(item[1]), parseFloat(item[2]), parseFloat(item[3]), parseFloat(item[4])],
        }));
        setOhlcv(formattedData);
      } catch (error) {
        console.error('Error fetching OHLCV data:', error.message);
        setOhlcv(null);
      } finally {
        setLoading(false);
      }
    };
    fetchOhlcv();
  }, [address]);

  if (loading) {
    return <div className="chart-loading">Loading chart...</div>;
  }

  if (!ohlcv) {
    return <div className="chart-error">Error loading chart: No data available</div>;
  }

  const options = {
    chart: {
      type: 'candlestick',
      height: 50,
      toolbar: { show: true },
      zoom: { enabled: true },
    },
    title: { text: 'Price Chart (5m Candles)', align: 'left', style: { fontSize: '12px' } },
    xaxis: {
      type: 'datetime',
      labels: { datetimeUTC: false, format: 'HH:mm', style: { fontSize: '10px' } },
      tooltip: { enabled: true },
    },
    yaxis: {
      tooltip: { enabled: true },
      labels: { formatter: (value) => `$${value.toFixed(6)}`, style: { fontSize: '10px' } },
    },
    plotOptions: {
      candlestick: { colors: { upward: '#00B746', downward: '#EF403C' } },
    },
  };

  const series = [{ data: ohlcv }];

  return (
    <div className="chart-container">
      <Chart options={options} series={series} type="candlestick" height={200} />
    </div>
  );
};

function Stormdex({ openNav, closeNav, isSidenavOpen, curiosityButtonRef }) {
  const [pools, setPools] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState(null);
  const [expandedTokens, setExpandedTokens] = useState({});
  const { connected, signAndExecuteTransactionBlock, address } = useWallet();

  useEffect(() => {
    if (notification) {
      const timeout = notification.type === 'success' ? 3000 : 10000;
      const timer = setTimeout(() => setNotification(null), timeout);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  const fetchData = async () => {
    try {
      const response1 = await fetch(
        'https://api.geckoterminal.com/api/v2/networks/sui-network/new_pools?include=base_token&page=1',
        { headers: { Accept: 'application/json' } }
      );
      const data1 = await response1.json();

      const response2 = await fetch(
        'https://api.geckoterminal.com/api/v2/networks/sui-network/new_pools?include=base_token&page=2',
        { headers: { Accept: 'application/json' } }
      );
      const data2 = await response2.json();

      const poolData = [...data1.data, ...data2.data];
      const includedMap = new Map();
      [...(data1.included || []), ...(data2.included || [])].forEach((item) => {
        if (item.type === 'token') includedMap.set(item.id, item);
      });
      const included = Array.from(includedMap.values());

      const tokenMap = {};
      included.forEach((item) => {
        if (item.type === 'token') {
          tokenMap[item.id] = {
            image_url: item.attributes.image_url,
            decimals: item.attributes.decimals,
            name: item.attributes.name || item.attributes.symbol || 'Unknown',
            address: item.attributes.address,
          };
        }
      });

      const mappedPools = poolData.map((pool) => {
        const tokenId = pool.relationships.base_token.data.id;
        const tokenData = tokenMap[tokenId] || {};
        return {
          address: pool.attributes.address,
          name: pool.attributes.name.split(' ')[0],
          imageUrl: tokenData.image_url || null,
          createdAt: timeAgo(pool.attributes.pool_created_at),
          fdv: formatFDV(pool.attributes.fdv_usd),
          liquidity: formatLiquidity(pool.attributes.reserve_in_usd),
          buysSells: `${pool.attributes.transactions.h24.buys} / ${pool.attributes.transactions.h24.sells}`,
          priceChange24h: `${pool.attributes.price_change_percentage.h24}%`,
          supply: formatSupply(tokenData.decimals),
          tokenName: tokenData.name,
          tokenAddress: tokenData.address,
          volume24h: formatVolume(pool.attributes.volume_usd.h24),
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
    fetchData();
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleTokenClick = (address) => {
    setExpandedTokens((prev) => ({
      ...prev,
      [address]: !prev[address],
    }));
  };

  const handleCuriosityClick = async () => {
    if (!connected || !address) {
      setNotification({ type: 'error', message: 'Connect wallet to access Curiosity' });
      return;
    }

    setNotification({ type: 'pending', message: 'Transaction pending' });

    try {
      const tx = new Transaction();
      const [coin] = tx.splitCoins(tx.gas, [DEPOSIT_AMOUNT]);
      tx.moveCall({
        target: `${PACKAGE_ID}::deposit::deposit`,
        arguments: [coin, tx.object(REGISTRY_ID)],
      });

      const result = await signAndExecuteTransactionBlock({
        transactionBlock: tx,
        options: { showEffects: true },
      });

      console.log('Transaction result:', JSON.stringify(result, null, 2));
      setNotification({ type: 'success', message: 'Successfully deposited 0.01 SUI!' });
      openNav();
    } catch (error) {
      const errorMessage = error.message || 'Unknown error';
      console.error('Shinami API error:', errorMessage);
      setNotification({
        type: 'error',
        message: `Failed to deposit 0.01 SUI. Error: ${errorMessage}`,
      });
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="stormdex">
      <div className="table-controls">
        <button className="curiosity-button" onClick={handleCuriosityClick} ref={curiosityButtonRef}>
          Curiosity
        </button>
      </div>
      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>TOKEN</th>
              <th>AGE</th>
              <th>FDV</th>
              <th>LIQUIDITY</th>
              <th>SUPPLY</th>
              <th>BUYS/SELLS</th>
              <th>% CH (24H)</th>
              <th>VOL.(24H)</th>
            </tr>
          </thead>
          <tbody>
            {pools.map((pool, index) => (
              <React.Fragment key={index}>
                <tr>
                  <td data-label="TOKEN">
                    <div className="token-container">
                      {pool.imageUrl ? (
                        <img src={pool.imageUrl} alt={pool.name} className="token-icon" />
                      ) : (
                        <div className="token-letter-icon">
                          {pool.tokenName ? pool.tokenName.charAt(0).toUpperCase() : '?'}
                        </div>
                      )}
                      <span
                        style={{ cursor: 'pointer', color: 'blue' }}
                        onClick={() => handleTokenClick(pool.address)}
                      >
                        {pool.name}
                      </span>
                      <span
                        className="copy-icon"
                        onClick={() => {
                          navigator.clipboard.writeText(pool.tokenAddress);
                          setNotification({
                            type: 'success',
                            message: 'Address copied!',
                          });
                        }}
                        title="Copy address"
                      >
                        <FontAwesomeIcon icon={faCopy} />
                      </span>
                    </div>
                  </td>
                  <td data-label="CREATED">{pool.createdAt}</td>
                  <td data-label="FDV">{pool.fdv}</td>
                  <td data-label="LIQUIDITY">{pool.liquidity}</td>
                  <td data-label="SUPPLY">{pool.supply}</td>
                  <td data-label="BUYS/SELLS">{pool.buysSells}</td>
                  <td
                    data-label="% CH (24H)"
                    className={pool.priceChange24h.startsWith('-') ? 'negative' : 'positive'}
                  >
                    {pool.priceChange24h}
                  </td>
                  <td data-label="VOL.(24H)">{pool.volume24h}</td>
                </tr>
                <tr>
                  <td></td>
                  <td></td>
                  <td></td>
                  <td data-label="Status" className="status">
                    LOCKED
                  </td>
                  <td data-label="Audit" className="status">
                    MAD
                  </td>
                  <td data-label="Security" className="status">
                    NOT HONEYPOT
                  </td>
                  <td></td>
                  <td></td>
                </tr>
                <tr>
                  <td colSpan="8">
                    {expandedTokens[pool.address] ? (
                      <TokenChart address={pool.address} />
                    ) : (
                      <div className="thin-line"></div>
                    )}
                  </td>
                </tr>
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>
      {notification && (
        <div className={`notification ${notification.type}`}>
          {notification.type === 'pending' && <div className="pending-bulb"></div>}
          <span>{notification.message}</span>
        </div>
      )}
    </div>
  );
}

export default Stormdex;
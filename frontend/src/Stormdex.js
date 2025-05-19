import React, { useState, useEffect } from 'react';
import './Stormdex.css';
import { useWallet } from '@suiet/wallet-kit';
import { Transaction } from '@mysten/sui/transactions';
import { createSuiClient } from '@shinami/clients/sui';
import Chart from 'react-apexcharts';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCopy } from '@fortawesome/free-solid-svg-icons';
import SearchBar from './SearchBar';

// Shinami Node Service setup
const SHINAMI_NODE_ACCESS_KEY = process.env.REACT_APP_SHINAMI_NODE_KEY;
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

const formatPrice = (priceStr) => {
  if (!priceStr) return 'N/A';
  const price = parseFloat(priceStr);
  if (isNaN(price)) return 'N/A';
  if (price === 0) return '0';
  if (price >= 1) return price.toFixed(6).substring(0, 7);
  const priceString = price.toFixed(20);
  const match = priceString.match(/^0\.0*([1-9]\d{0,2})/);
  if (match) {
    const leadingZeros = priceString.indexOf(match[1]) - 2;
    if (leadingZeros > 2) {
      const significantDigits = match[1];
      const subscript = leadingZeros;
      return `0.0<sub>${subscript}</sub>${significantDigits}`;
    }
  }
  return price.toFixed(6).substring(0, 7);
};

// Smart contract details
const PACKAGE_ID = '0x96c9f8a44996202c76c9409714ff3004eaea0b48cc0e01962c00491cecfeff58';
const REGISTRY_ID = '0x73b8026c23df9ab670f867b03339023793a40285e0094b1b2a1dede6063bf31c';
const DEPOSIT_AMOUNT = 10_000_000; // 0.01 SUI in MIST
const API_KEY = 'insidex_api.WXS56EMcnIBbZjw4WF6OUX2P';

// AuditPieChart Component
const AuditPieChart = ({ marketData }) => {
  if (!marketData) return <div className="audit-pie-chart">N/A</div>;

  const { isMintable, lpBurnt, isCoinHoneyPot } = marketData;
  const mintAuthority = isMintable === 'false' ? '#28a745' : '#dc3545'; // Green or Red
  const lockedLiquidity = lpBurnt === 'true' ? '#28a745' : '#dc3545';
  const honeypot = isCoinHoneyPot === 'false' ? '#28a745' : '#dc3545';

  const chartData = {
    series: [1, 1, 1],
    options: {
      chart: { type: 'pie', width: 40, height: 40 },
      colors: [mintAuthority, lockedLiquidity, honeypot],
      labels: ['Mint', 'Liquidity', 'Honeypot'],
      plotOptions: { pie: { dataLabels: { offset: -5 } } },
      legend: { show: false },
      dataLabels: { enabled: false },
      fill: { opacity: 1 },
      states: { hover: { filter: { type: 'none' } } },
      tooltip: {
        enabled: true,
        custom: ({ seriesIndex }) => {
          const labels = ['Mint Authority', 'Locked Liquidity', 'Honeypot'];
          const status = chartData.options.colors[seriesIndex] === '#28a745' ? 'No' : 'Yes';
          return `<div>${labels[seriesIndex]}: ${status}</div>`;
        },
      },
    },
  };

  return (
    <div className="audit-pie-chart">
      <Chart
        options={chartData.options}
        series={chartData.series}
        type="pie"
        width={40}
        height={40}
      />
    </div>
  );
};


// TokenChart Component (Expanded View)
const TokenChart = ({ address }) => {
  const [ohlcv, setOhlcv] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOhlcv = async () => {
      try {
        const response = await fetch(
          `https://api.geckoterminal.com/api/v2/networks/sui-network/pools/${address}/ohlcv/minute?aggregate=1&limit=100¤cy=usd&token=base`
        );
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const data = await response.json();
        const ohlcvList = data.data.attributes.ohlcv_list;
        if (!ohlcvList || ohlcvList.length === 0) throw new Error('No OHLCV data');
        const formattedData = ohlcvList.map((item) => ({
          x: new Date(item[0] * 1000),
          y: [parseFloat(item[1]), parseFloat(item[2]), parseFloat(item[3]), parseFloat(item[4])],
        }));
        setOhlcv(formattedData);
      } catch (error) {
        console.error('Error fetching OHLCV:', error.message);
        setOhlcv(null);
      } finally {
        setLoading(false);
      }
    };
    fetchOhlcv();
  }, [address]);

  if (loading) return <div className="chart-loading">Loading chart...</div>;
  if (!ohlcv) return <div className="chart-error">No data available</div>;

  const options = {
    chart: { type: 'candlestick', height: 200, toolbar: { show: true }, zoom: { enabled: true } },
    title: { text: 'Price (1m)', align: 'left', style: { fontSize: '12px' } },
    xaxis: { type: 'datetime', labels: { format: 'HH:mm', style: { fontSize: '10px' } } },
    yaxis: { labels: { formatter: (val) => `$${val.toFixed(6)}`, style: { fontSize: '10px' } } },
    plotOptions: { candlestick: { colors: { upward: '#00B746', downward: '#EF403C' } } },
  };

  return (
    <div className="chart-container">
      <Chart options={options} series={[{ data: ohlcv }]} type="candlestick" height={200} />
    </div>
  );
};

function Stormdex({ openNav, closeNav, isSidenavOpen, curiosityButtonRef }) {
  const [pools, setPools] = useState([]);
  const [marketData, setMarketData] = useState({});
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState(null);
  const [expandedTokens, setExpandedTokens] = useState({});
  const [marketDataBatchIndex, setMarketDataBatchIndex] = useState(0);
  const [isBatchLoading, setIsBatchLoading] = useState(false);
  const { connected, signAndExecuteTransactionBlock, address } = useWallet();

  useEffect(() => {
    if (notification) {
      const timeout = notification.type === 'success' ? 3000 : 10000;
      const timer = setTimeout(() => setNotification(null), timeout);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  const fetchPools = async () => {
    try {
      const [response1, response2] = await Promise.all([
        fetch('https://api.geckoterminal.com/api/v2/networks/sui-network/new_pools?include=base_token&page=1'),
        fetch('https://api.geckoterminal.com/api/v2/networks/sui-network/new_pools?include=base_token&page=2'),
      ]);
      const [data1, data2] = await Promise.all([response1.json(), response2.json()]);
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
        const buys = parseInt(pool.attributes.transactions.h24.buys, 10);
        const sells = parseInt(pool.attributes.transactions.h24.sells, 10);
        return {
          address: pool.attributes.address,
          name: pool.attributes.name.split(' ')[0],
          imageUrl: tokenData.image_url || null,
          createdAt: timeAgo(pool.attributes.pool_created_at),
          price: pool.attributes.base_token_price_usd,
          fdv: formatFDV(pool.attributes.fdv_usd),
          liquidity: formatLiquidity(pool.attributes.reserve_in_usd),
          buysSells: `${buys} / ${sells}`,
          traders: `${pool.attributes.transactions.h24.buyers} / ${pool.attributes.transactions.h24.sellers}`,
          priceChange24h: `${pool.attributes.price_change_percentage.h24}%`,
          supply: formatSupply(tokenData.decimals),
          tokenName: tokenData.name,
          tokenAddress: tokenData.address,
          volume24h: formatVolume(pool.attributes.volume_usd.h24),
          eligibleForAudit: buys > 0 && sells > 0,
        };
      });

      setPools(mappedPools);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching pools:', error);
      setLoading(false);
    }
  };

  const fetchMarketData = async (addresses) => {
    if (addresses.length === 0) return;
    setIsBatchLoading(true);
    try {
      const response = await fetch(
        `https://api-ex.insidex.trade/coins/multiple/market-data?coins=${addresses.join(',')}`,
        { headers: { 'x-api-key': API_KEY } }
      );
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const data = await response.json();
      const marketDataMap = {};
      data.forEach((item) => {
        marketDataMap[item.coin] = item;
      });
      setMarketData((prev) => ({ ...prev, ...marketDataMap }));
    } catch (error) {
      console.error('Error fetching market data:', error);
      setNotification({ type: 'error', message: `Failed to fetch market data: ${error.message}` });
    } finally {
      setIsBatchLoading(false);
    }
  };

  useEffect(() => {
    fetchPools();
    const interval = setInterval(fetchPools, 10000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (pools.length > 0 && marketDataBatchIndex === 0) {
      const eligibleAddresses = pools
        .filter((pool) => pool.eligibleForAudit)
        .slice(0, 5)
        .map((pool) => pool.tokenAddress);
      fetchMarketData(eligibleAddresses);
      setMarketDataBatchIndex(5);
    }
  }, [pools]);

  useEffect(() => {
    if (pools.length > 0 && !isBatchLoading && marketDataBatchIndex < pools.length) {
      const interval = setInterval(() => {
        const eligibleAddresses = pools
          .filter((pool) => pool.eligibleForAudit)
          .slice(marketDataBatchIndex, marketDataBatchIndex + 5)
          .map((pool) => pool.tokenAddress);
        fetchMarketData(eligibleAddresses);
        setMarketDataBatchIndex((prev) => prev + 5);
      }, 10000); // 10-second interval
      return () => clearInterval(interval);
    }
  }, [pools, isBatchLoading, marketDataBatchIndex]);

  const handleTokenClick = (address) => {
    setExpandedTokens((prev) => ({ ...prev, [address]: !prev[address] }));
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
      setNotification({ type: 'success', message: 'Successfully deposited 0.01 SUI!' });
      openNav();
    } catch (error) {
      setNotification({
        type: 'error',
        message: `Failed to deposit 0.01 SUI: ${error.message}`,
      });
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="stormdex">
      <div className="table-controls">
        <SearchBar />
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
              <th>PRICE</th>
              <th>FDV</th>
              <th>LIQUIDITY</th>
              <th>SUPPLY</th>
              <th>BUYS/SELLS</th>
              <th>TRADERS</th>
              <th>% CH (24H)</th>
              <th>VOL.(24H)</th>
              <th>AUDIT</th>
              <th>TREND</th>
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
                          setNotification({ type: 'success', message: 'Address copied!' });
                        }}
                        title="Copy address"
                      >
                        <FontAwesomeIcon icon={faCopy} />
                      </span>
                    </div>
                  </td>
                  <td data-label="CREATED">{pool.createdAt}</td>
                  <td data-label="PRICE" dangerouslySetInnerHTML={{ __html: formatPrice(pool.price) }} />
                  <td data-label="FDV">{pool.fdv}</td>
                  <td data-label="LIQUIDITY">{pool.liquidity}</td>
                  <td data-label="SUPPLY">{pool.supply}</td>
                  <td data-label="BUYS/SELLS">{pool.buysSells}</td>
                  <td data-label="TRADERS">
                    <span className="traders-buyers">{pool.traders.split('/')[0]}</span> / 
                    <span className="traders-sellers">{pool.traders.split('/')[1]}</span>
                  </td>
                  <td
                    data-label="% CH (24H)"
                    className={pool.priceChange24h.startsWith('-') ? 'negative' : 'positive'}
                  >
                    {pool.priceChange24h}
                  </td>
                  <td data-label="VOL.(24H)">{pool.volume24h}</td>
                  <td data-label="AUDIT">
                    {pool.eligibleForAudit ? (
                      <AuditPieChart marketData={marketData[pool.tokenAddress]} />
                    ) : (
                      <div>N/A</div>
                    )}
                  </td>
                  <td data-label="TREND"></td> {/* MiniTokenChart removed */}
                </tr>
                <tr>
                  <td colSpan="12">
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
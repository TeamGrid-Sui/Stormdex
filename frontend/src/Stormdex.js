import React, { useState, useEffect } from 'react';
import './Stormdex.css';
import { useWallet } from '@suiet/wallet-kit';
import { Transaction } from '@mysten/sui/transactions';
import { createSuiClient } from '@shinami/clients/sui';

// Shinami Node Service setup
const SHINAMI_NODE_ACCESS_KEY = process.env.REACT_APP_SHINAMI_NODE_KEY;
if (!SHINAMI_NODE_ACCESS_KEY) {
  console.error('Shinami Node API key is missing. Please set REACT_APP_SHINAMI_NODE_KEY in .env');
  throw new Error('Shinami Node API key is missing');
}
const nodeClient = createSuiClient(SHINAMI_NODE_ACCESS_KEY);

// Utility functions (unchanged)
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

// Smart contract details
const PACKAGE_ID = '0x96c9f8a44996202c76c9409714ff3004eaea0b48cc0e01962c00491cecfeff58'; // Update after redeployment
const REGISTRY_ID = '0x73b8026c23df9ab670f867b03339023793a40285e0094b1b2a1dede6063bf31c'; // Update after redeployment
const DEPOSIT_AMOUNT = 10_000_000; // 0.01 SUI in MIST

function Stormdex({ openNav, closeNav, isSidenavOpen, curiosityButtonRef }) {
  const [pools, setPools] = useState([]);
  const [loading, setLoading] = useState(true);
  const { connected, signAndExecuteTransactionBlock, address } = useWallet();

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
          };
        }
      });

      const mappedPools = poolData.map((pool) => {
        const tokenId = pool.relationships.base_token.data.id;
        const tokenData = tokenMap[tokenId] || {};
        return {
          name: pool.attributes.name.split(' ')[0],
          imageUrl: tokenData.image_url || null,
          createdAt: timeAgo(pool.attributes.pool_created_at),
          fdv: formatFDV(pool.attributes.fdv_usd),
          buysSells: `${pool.attributes.transactions.h24.buys} / ${pool.attributes.transactions.h24.sells}`,
          vol24h: `${pool.attributes.price_change_percentage.h24}%`,
          supply: formatSupply(tokenData.decimals),
          tokenName: tokenData.name,
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

  const handleCuriosityClick = async () => {
    if (!connected || !address) {
      alert('Connect wallet to access Curiosity');
      return;
    }

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

      if (result.effects?.status?.status === 'success') {
        alert('Successfully deposited 0.01 SUI!');
        openNav();
      } else {
        throw new Error(`Transaction failed: ${result.effects?.status?.error || 'Unknown error'}`);
      }
    } catch (error) {
      let errorMessage = 'Failed to deposit 0.01 SUI. ';
      if (error.message.includes('InsufficientGas')) {
        errorMessage += 'Insufficient gas in your wallet.';
      } else if (error.message.includes('Balance')) {
        errorMessage += 'Insufficient SUI balance. Ensure you have at least 0.01 SUI plus gas.';
      } else if (error.message.includes('EIncorrectAmount')) {
        errorMessage += 'Incorrect deposit amount. Must be exactly 0.01 SUI.';
      } else {
        errorMessage += `Please try again or check your wallet. Error: ${error.message}`;
      }
      alert(errorMessage);
      console.error('Deposit error:', error);
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="stormdex">
      <div className="table-controls">
        <button
          className="curiosity-button"
          onClick={handleCuriosityClick}
          ref={curiosityButtonRef}
        >
          Curiosity
        </button>
      </div>
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
                  <td data-label="LIQUIDITY">{/* Placeholder */}</td>
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
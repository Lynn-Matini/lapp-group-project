import { useState, useEffect } from 'react';
import styles from './Media.module.css';
import { Buffer } from 'buffer';

const media = [
  {
    name: 'Succulent (photo)',
    price: 200,
    source: '01.jpeg',
    invoice: '',
    paymentHash: '',
    buyButton: false,
    checkButton: false,
    fileDownloadUrl: '',
  },
  {
    name: 'Melbourne (photo)',
    price: 200,
    source: '02.jpeg',
    invoice: '',
    paymentHash: '',
    buyButton: false,
    checkButton: false,
    fileDownloadUrl: '',
  },
  {
    name: 'Madayaka (photo)',
    price: 1000,
    source: '03.jpeg',
    invoice: '',
    paymentHash: '',
    buyButton: false,
    checkButton: false,
    fileDownloadUrl: '',
  },
];

function Media(props) {
  const [mediaList, setMedia] = useState(media);

  useEffect(() => {
    const storedMedia = mediaList.map((m) => {
      const savedData = localStorage.getItem(m.source);
      if (savedData) {
        try {
          return { ...m, ...JSON.parse(savedData) }; // Merge stored data with initial data
        } catch (error) {
          console.error('Error parsing stored data for', m.source, error);
          localStorage.removeItem(m.source); // Remove invalid data
          return m; // Return initial data if parsing fails
        }
      }
      return m;
    });
    setMedia(storedMedia);
  }, []);

  return (
    <div>
      {mediaList.map((m) => {
        return (
          <div key={m.source} className={styles.container}>
            <div className={styles.imageWrapper}>
              <p>{m.name}</p>
              <p>Price: {m.price} sats</p>
              <img
                src={'assets/' + m.source}
                className={styles.image}
                alt={m.name}
              />
              <br />
              <button
                disabled={m.buyButton}
                className={styles.button}
                type="button"
                onClick={() => {
                  generateInvoice(m.source, m.price);
                }}
              >
                Purchase
              </button>
              <button
                disabled={m.checkButton}
                className={styles.button}
                type="button"
                onClick={() => {
                  checkInvoice(m.paymentHash);
                }}
              >
                Check Payment
              </button>
              <br />
              <textarea
                style={{ resize: 'none' }}
                rows="9"
                cols="32"
                value={m.invoice}
                readOnly
              ></textarea>
              <br />
              <a
                className={`${styles.link} ${
                  m.checkButton && m.buyButton ? styles.visible : ''
                }`}
                href={m.fileDownloadUrl}
                rel="noreferrer"
                target="_blank"
              >
                View
              </a>
              <br />
              <a
                className={`${styles.link} ${
                  m.checkButton && m.buyButton ? styles.visible : ''
                }`}
                href={m.fileDownloadUrl}
                rel="noreferrer"
                target="_blank"
                download
              >
                Download
              </a>
            </div>
          </div>
        );
      })}
    </div>
  );

  function generateInvoice(source, price) {
    fetch(`/generate-invoice/${source}/${price}`)
      .then((res) => res.json())
      .then((data) => {
        const updatedMedia = mediaList.map((m) => {
          if (m.source === source) {
            const updatedItem = {
              ...m,
              invoice: data.payment_request,
              paymentHash: Buffer.from(data.r_hash).toString('hex'),
              buyButton: true,
              checkButton: false,
            };
            localStorage.setItem(source, JSON.stringify(updatedItem)); // Store data
            return updatedItem;
          }
          return m;
        });
        setMedia(updatedMedia);

        // Save updated media item to local storage
        localStorage.setItem(
          source,
          JSON.stringify({
            invoice: data.payment_request,
            paymentHash: Buffer.from(data.r_hash).toString('hex'),
            buyButton: true,
            checkButton: false,
          })
        );
      });
  }

  function checkInvoice(paymentHash) {
    fetch(`/check-invoice/${paymentHash}`)
      .then((res) => {
        if (!res.ok) {
          // Log the backend error message for debugging
          return res.json().then((err) => {
            console.error('Backend error during checkInvoice:', err);
            throw new Error(
              err.details || 'Failed to check invoice on frontend'
            );
          });
        }
        return res.json();
      })
      .then((data) => {
        if (data.settled === true) {
          getContent(data.memo).then((res) => {
            const updatedMedia = mediaList.map((m) => {
              if (m.source === data.memo) {
                return {
                  ...m,
                  invoice: 'THANK YOU',
                  checkButton: true,
                  fileDownloadUrl: res,
                };
              }
              return m;
            });
            setMedia(updatedMedia);
          });
        } else {
          alert('Payment not yet received');
        }
      });
  }

  async function getContent(source) {
    const response = await fetch(`/file/${source}`);
    const blob = await response.blob();
    return URL.createObjectURL(blob); // Create a URL for the file
  }
}

export default Media;

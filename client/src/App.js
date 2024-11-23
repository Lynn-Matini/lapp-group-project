import React, { useState } from 'react';
import './App.css';

class App extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      alias: '',
    };
  }

  componentDidMount() {
    const getInfo = async () => {
      const response = await fetch('/getinfo');
      const { alias } = await response.json();
      this.setState({
        alias,
      });
    };
    getInfo();
  }
  render() {
    return (
      <div>
        <p>{this.state.alias}</p>
        <Media />
      </div>
    );
  }
}

//Images
const media = [
  {
    name: 'Succulent (photo)',
    price: 200,
    source: 'plant1.jpeg',
  },
  {
    name: 'Melbourne (photo)',
    price: 200,
    source: 'plant2.jpeg',
  },
  {
    name: 'Madayaka (photo)',
    price: 1000,
    source: 'plant3.jpeg',
  },
];

function Media(props) {
  const [mediaList, setMedia] = useState(media);

  return (
    <div>
      {mediaList.map((m) => {
        return (
          <div
            key={m.source}
            style={{
              border: '3px solid gray',
              borderRadius: '5px',
              margin: '10px',
              padding: '10px',
              width: '350px',
              display: 'inline-block',
              height: '550px',
              whiteSpace: 'nowrap',
            }}
          >
            <div style={{ margin: 'auto', width: '80%' }}>
              <p>{m.name}</p>
              <p>Price: {m.price} sats</p>
              <img src={'assets/' + m.source} height="220px" alt={m.name} />
              <br />
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default App;

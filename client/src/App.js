import React from 'react';
import Media from './Media';
import styles from './Media.module.css';

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
        <p className={styles.alias}>{this.state.alias}</p>
        <Media />
      </div>
    );
  }
}

export default App;

import React, { Component } from 'react';
import FaceRecognition from './components/FaceRecognition/FaceRecognition';
import ImageLinkForm from './components/ImageLinkForm/ImageLinkForm';
import Navigation from './components/Navigation/Navigation';
import Register from './components/Register/Register';
import Signin from './components/Signin/Signin';
import Particles from 'react-particles-js';
import Logo from './components/Logo/Logo';
import Rank from './components/Rank/rank';
import Clarifai from 'clarifai';
import './App.css';
import 'tachyons';


const app = new Clarifai.App({
 apiKey: process.env.API_CLARIFAI
});

const particlesOptions = {
  particles: {
    number: {
      value: 100,
      density: {
        enable: true,
        value_area: 600
      }
    }
  }
}

const initialState = {
  input: '',
  imageUrl: '',
  box: {},
  route: 'signin',
  isSignedIn: false,
  user: {
    id: '',
    name: '',
    email: '',
    entries: 0,
    joined: ''
  }
}

class App extends Component {
  constructor() {
    super();
    this.state = initialState;
  }

  updateUser = (data) => {
    this.setState({user: {
      id: data.id,
      name: data.name,
      entries: data.entries,
      email: data.email,
      joined: data.joined
    }})
  }


  calculateFaceLocation = (data) => {
    const clarifaiFace = data.outputs[0].data.regions[0].region_info.bounding_box;
    const image = document.getElementById('inputimage');
    const width = Number(image.width);
    const height = Number(image.height);
    return {
      leftCol: clarifaiFace.left_col * width,
      topRow: clarifaiFace.top_row * height,
      rightCol: width - (clarifaiFace.right_col * width),
      bottomRow: height - (clarifaiFace.bottom_row * height)
    }
  }

  displayFaceBox = (box) => {
    this.setState({box: box});
  }

  onInputChange = (event) => {
    this.setState({input: event.target.value});
  }

  onButtonSubmit = () => {
    this.setState({imageUrl: this.state.input});
    app.models
      .predict(
        Clarifai.FACE_DETECT_MODEL,
        this.state.input)
      .then(response => {
        if (response) {
          fetch('https://desolate-anchorage-14233.herokuapp.com/image', {
            method: 'put',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({
               id: this.state.user.id
             })
           })
          
              .then(response => response.json())
              .then(count => {
                this.setState(Object.assign(this.state.user, { entries: count}))
              })

            }
        this.displayFaceBox(this.calculateFaceLocation(response))
      })
      .catch(err => console.log(err));
  }

  onRouteChange = (route) => {
    if (route === 'signout') {
      this.setState(initialState)
    } else if (route === 'home') {
      this.setState({isSignedIn: true})
    }
    this.setState({route: route})
  }

   render() {
     const {isSignedIn, route, box, imageUrl} = this.state;
    return (
      <div className="App">
        <Particles    
           params={particlesOptions}
           className='particles'
        />
        <Navigation isSignedIn={isSignedIn} onRouteChange={this.onRouteChange}/>
        { route === 'home'
          ? <div>
                <Logo />
                <Rank 
                  name={this.state.user.name}
                  entries={this.state.user.entries}
                />
                <ImageLinkForm
                  onInputChange={this.onInputChange}
                  onButtonSubmit={this.onButtonSubmit}   
                />
                <FaceRecognition box={box} imageUrl={imageUrl} />
              </div>
         : ( 
           route === 'signin'
            ? <Signin updateUser={this.updateUser} onRouteChange={this.onRouteChange} />
            : <Register updateUser={this.updateUser} onRouteChange={this.onRouteChange} />            
            )
        }
      </div>
    );
  }
}

export default App;


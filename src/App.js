import React, { Component } from "react";
import { connect } from "react-redux";
import { Switch, Route, withRouter } from "react-router-dom";
import firebase from "./firebase";
// import Navbar from "./components/Navbar";
import Admin from "./components/Admin";
import PostList from "./components/PostList";
import PostDetail from "./components/PostDetail";
import { setAuthUser } from "./store/actions";

class App extends Component {
  componentDidMount() {
    firebase.auth().onAuthStateChanged(authUser => {
      this.props.setAuthUser(authUser);
    });
  }

  render() {
    return (
      // <Navbar match={this.props.match}>
        <Switch>
          <Route path="/admin" exact component={Admin} />
          <Route path="/" exact component={PostList} />]
          <Route path="/:postId" exact component={PostDetail} />
        </Switch>
      // </Navbar>
    );
  }
}

const mapStateToProps = state => ({
  authUser: state.authState.authUser
});

const mapDispatchToProps = { setAuthUser };
export default withRouter(
  connect(
    mapStateToProps,
    mapDispatchToProps
  )(App)
);

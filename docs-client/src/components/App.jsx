import {
  BrowserRouter as Router,
  Switch,
  Route,
  Redirect,
} from "react-router-dom";
import { v4 as uuidV4 } from "uuid";

import "../styles/App.css";
import TextEditor from "./TextEditor";

function App() {
  console.log(import.meta.env.VITE_SERVER_URI);

  return (
    <Router>
      <Switch>
        <Route path="/" exact>
          <Redirect to={`documents/${uuidV4()}`} />
        </Route>
        <Route path="/documents/:id">
          <TextEditor />
        </Route>
      </Switch>
    </Router>
  );
}

export default App;

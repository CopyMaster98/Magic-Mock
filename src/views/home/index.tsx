import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { Layout } from "antd";
import "./index.css";
import Header from "../../components/header";
import { header } from "../../constant/index";
import Detail from "../detail";
import HomeDetail from "./home-detail";
import Resource from "../resource";

const Home: React.FC = () => {
  return (
    <Router>
      <Layout className="home-container">
        <Header items={header.headerItems} />
        <Layout>
          <Routes>
            <Route path="/" Component={HomeDetail} />
            <Route path="/home" Component={HomeDetail} />
            <Route path="/detail" Component={Detail}></Route>
            <Route path="/detail/:id" Component={Detail}></Route>
            <Route path="/detail/:projectId/:ruleId" Component={Detail}></Route>
            <Route path="/resource" Component={Resource}></Route>
            <Route path="/resource/:id" Component={Resource}></Route>
            <Route
              path="/resource/:resourceId/:ruleId"
              Component={Resource}
            ></Route>
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </Layout>
      </Layout>
    </Router>
  );
};

export default Home;

import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from 'antd';
import './index.css'
import Header from '../../components/header';
import { header } from '../../constant/index'
import Detail from '../detail';

const Home: React.FC = () => {
  const HomeContainer: React.FC = () => <div>Hello</div>

  return (
      <Router>
        <Layout className='home-container'>
          <Header items={header.headerItems} />
          <Layout>
          <Routes>
                <Route path="/" Component={HomeContainer} />
                <Route path='/home' Component={HomeContainer} />
                <Route path='/detail' Component={Detail}></Route>
                <Route path="*" element={<Navigate to="/" />} />
              </Routes>
          </Layout>
        </Layout>
      </Router>
  );
};

export default Home
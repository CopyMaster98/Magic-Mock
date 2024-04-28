import React from 'react';
import { To, useNavigate as _userNavigate } from 'react-router-dom';

export const useNavigate = () => {
  const navigate = _userNavigate();

  return (route: To) => navigate(route)
}
import React from 'react';
import { useNavigate as _userNavigate } from 'react-router-dom';

export const useNavigate = (route: string) => {
  const navigate = _userNavigate();

  navigate(route)
}
import { useRef } from 'react';
import "./x-greet.js";

export const Greet = () => {
  const wc = useRef(null);

  return (
    <x-greet ref={wc}>
      <p>Hello</p>
    </x-greet>
  );
};

export default Greet;

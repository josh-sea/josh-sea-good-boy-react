import React, { useEffect, useRef } from 'react';

const ChartGen = ({getChart, data}) => {
  const div = useRef(null)
    useEffect(() => {
      const chart = getChart(div.current,data)
      chart.render();
    },[data, getChart])
  return (
    <>
     <div ref={div}>
     </div>
   </>
  );
}

export default ChartGen;

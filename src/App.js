import React, { Component } from 'react';
import * as d3 from 'd3';
import * as dc from 'dc';
import * as crossfilter from 'crossfilter2/crossfilter.min.js'
import ChartGen from './chartGen';

class App extends Component {
  state = {
    cf: null,
    colorScheme: ['#ffffcc', '#a1dab4', '#41b6c4', '#2c7fb8', '#253494', '#7fcdbb'],
    today: React.createRef(),
    week: React.createRef(),
    month: React.createRef(),
    chart: React.createRef(),
  }

  componentDidMount() {
    (async () => {
      const response = await fetch('https://goodboyserver.herokuapp.com/api/buttons');
      const data = await response.json();
      const ndx = crossfilter(data);
      this.setState({ cf: ndx });
    })()
  }

  getChart = (node,ndx) => {
    const chart = dc.barChart(node);
    const dimension = ndx.dimension((d) => {
        return d.good
    })

    const group = dimension.group().reduceCount();

    chart
      .width(768)
      .height(380)
      .x(d3.scaleBand())
      .xUnits(dc.units.ordinal)
      .brushOn(false)
      .xAxisLabel('Good?')
      .yAxisLabel('Tally')
      .dimension(dimension)
      .barPadding(0.1)
      .outerPadding(0.05)
      .group(group)
      .transitionDuration(0)
      .on('renderlet',function(chart){
        chart.selectAll("g rect.bar")
          .attr("fill", function(d){
            if (d.x) {
              return "green";
            } else {
              return "red";
            }
          });
      });
    this.setState({chart: {current:chart}});
    return chart
  }

  handleClick = (click) => {
    const { today, week, month, chart } = this.state;
    if (click.target === today.current){
      console.log(chart.current._dimension.filter())
    }
    if (click.target === week.current){

    }
    if (click.target === month.current){

    }
  }

  render(){
    const { cf, today, week, month } = this.state;

    return (
      <div style={{width:'100vw',height:'100vh'}}>
        <button onClick={this.handleClick} ref={today}>Today</button>
        <button onClick={this.handleClick} ref={week}>This Week</button>
        <button onClick={this.handleClick} ref={month}>This Month</button>
        {cf && <ChartGen getChart={this.getChart} data={cf} />}
       </div>
    )
  }
}

export default App;

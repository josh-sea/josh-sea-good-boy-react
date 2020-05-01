import React, { Component } from 'react';
import * as d3 from 'd3';
import * as dc from 'dc';
import * as crossfilter from 'crossfilter2/crossfilter.min.js'
import ChartGen from './chartGen';

class App extends Component {
  state = {
    cf: null,
    dateDim: {},
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
      const dateDim = ndx.dimension(function(d){
        return d.create_at;
      })
      this.setState({ cf: ndx, dateDim })
    })();

    setInterval(async () => {
      const response = await fetch('https://goodboyserver.herokuapp.com/api/buttons');
      const data = await response.json();
      if (this.state.cf){
          this.setState(prevState=>{
            return {cf:prevState.cf.remove(()=>true)}
          },()=>{
            const ndx = crossfilter(data);
            this.setState({cf:ndx},()=>{
              dc.redrawAll()
            })
          })
      }else {
        const ndx = crossfilter(data);
        const dateDim = ndx.dimension(function(d){
          return d.create_at;
        })
        this.setState({ cf: ndx, dateDim });
      }
    },15000)
  }

  getChart = (node,ndx) => {
    const chart = dc.pieChart(node);
    const dimension = ndx.dimension((d) => {
      if (d.good){
        return "Good Boy"
      }else {
        return "Bad Boy"
      }
    })

    const group = dimension.group();

    chart
      .width(768)
      .height(380)
      .dimension(dimension)
      .group(group)
      .transitionDuration(0)
      .colors(d3.scaleOrdinal().domain([true,false]).range(["#0f0", "#f00"]))
      .colorAccessor(function (d) {
        if (d.key === "Good Boy") {
          return true
        } else {
          return false
        }
      })

    this.setState({chart: {current:chart}});
    return chart
  }

  getWeekChart = (node,ndx) => {
    const chart = dc.barChart(node);
    const dimension = ndx.dimension((d) => {
        return new Date(new Date(d.created_at).setMinutes(0,0,0))
    })

    const group = dimension.group().reduceSum(function(d){
      if (d.good){
        return 1
      } else {
        return -1
      }
    })

    chart
        .width(768)
        .height(400)
        .x(d3.scaleBand())
        .xUnits(dc.units.ordinal)
        .elasticX(true)
        .xAxisLabel('Date')
        .yAxisLabel('Good Boy Bad Boy')
        .dimension(dimension)
        .group(group)
        .margins({
          top: 20,
          right: 20,
          bottom: 100,
          left: 50
        })
        .colors(d3.scaleOrdinal().domain([true,false]).range(["#0f0", "#f00"]))
        .colorAccessor(function (d) {
          if (d.value > 0) {
            return true
          } else {
            return false
          }
        })
        .on("renderlet", function(chart) {
          chart.select('.axis.x')
           .attr("text-anchor", "end")
           .selectAll("text")
           .text(function(d){ return new Date(d).toDateString() })
           .attr("transform", "rotate(-45)")
           .attr("dy", "-0.7em")
           .attr("dx", "-1em");
        });

    return chart
  }

  handleClick = (click) => {
    const { dateDim, today, week, month, chart } = this.state;
    if (click.target === today.current){
      dateDim.top(Infinity).map(d=>{
        console.log(new Date(d.created_at).toDateString());
      })
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
        {cf && <ChartGen getChart={this.getWeekChart} data={cf} />}
       </div>
    )
  }
}

export default App;

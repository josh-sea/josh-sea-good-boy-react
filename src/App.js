import React, { Component } from 'react';
import * as d3 from 'd3';
import * as dc from 'dc';
import * as crossfilter from 'crossfilter2/crossfilter.min.js'
import ChartGen from './chartGen';
import  { Container, Button, Ref, Grid } from 'semantic-ui-react';

class App extends Component {
  state = {
    cf: null,
    dateDim: {},
    height: 0,
    width: 0,
    colorScheme: ['#ffffcc', '#a1dab4', '#41b6c4', '#2c7fb8', '#253494', '#7fcdbb'],
    today: React.createRef(),
    all: React.createRef(),
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
        return d.created_at;
      })
    const height = window.innerHeight;
    const width = window.innerWidth;


      let resizeId;
      window.addEventListener('resize',()=>{
        clearTimeout(resizeId);
        resizeId = setTimeout(watchResize, 500);
      });
      const watchResize = () => {
          dc.chartRegistry.list().forEach(chart => {
            const _bbox = chart.root().node().parentNode.getBoundingClientRect();
            chart.width(_bbox.width).height(_bbox.height).render();
          });
      };

    this.setState({ cf: ndx, dateDim, height, width })
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
    },90000000)
  }

  remove_empty_bins = (source_group) => {
    return {
      all: function() {
        return source_group.all().filter(function(d) {
          return d.value != 0;
        });
      }
    };
  }


  getPie = (node,ndx) => {
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
      .width(750)
      .height(300)
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

  getBarChart = (node,ndx) => {
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

    const filtered_group = this.remove_empty_bins(group);

    const height = this.state.height/2;
    const width = this.state.width/2;

    chart
        .width(750)
        .height(300)
        .x(d3.scaleBand())
        .xUnits(dc.units.ordinal)
        .elasticX(true)
        .elasticY(true)
        .xAxisLabel('Date')
        .yAxisLabel('Good Boy Bad Boy')
        .dimension(dimension)
        .group(filtered_group)
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
           .text(function(d){
             const date = new Date(d);
             const y = date.getFullYear();
             const m = date.getMonth() + 1;
             const day = date.getDate();
             const h = date.getHours();
             if (h>=12){
               const newDate = `${m}/${day}/${y} ${h}:00 PM`
               return newDate
             } else {
               const newDate = `${m}/${day}/${y} ${h}:00 AM`
               return newDate
             }
           })
           .attr("transform", "rotate(-45)")
           .attr("dy", "-0.7em")
           .attr("dx", "-1em");
        });

    return chart
  }

  handleClick = (click) => {
    const { dateDim, all, today, week, month, chart } = this.state;
    dateDim.filterAll();
    dateDim.filter(function(d){
        const now = new Date();
        const date = new Date(d);
        const today = new Date(d).setHours(0,0,0,0);
        const delta = now.getTime() - date.getTime();
        const deltaToday = now.getTime() - today;

        if (click.target === today.current){
          if (deltaToday <= 86400000){
            return d
          }
        }
        else if (click.target === week.current){
          if (delta <= 604800000){
            return d
          }
        }
        else if (click.target === month.current){
          if (delta <= 2628000000){
            return d
          }
        }
        else if (click.target === all.current){
            return d
          }
      })
      dc.redrawAll();
    }

  render(){
    const { cf, all, today, week, month } = this.state;
    return (
      <Container fluid textAlign='center'>
        <Button.Group>
        <Ref innerRef={all}>
          <Button onClick={this.handleClick}>All Time</Button>
        </Ref>
        <Ref innerRef={today}>
          <Button onClick={this.handleClick}>Today</Button>
        </Ref>
        <Ref innerRef={week}>
          <Button onClick={this.handleClick}>Past Week</Button>
        </Ref>
        <Ref innerRef={month}>
          <Button onClick={this.handleClick}>Past Month</Button>
        </Ref>
        </Button.Group>
        <Container fluid style={{padding:'20px'}}>
          <Grid columns={2} divided stackable>
            <Grid.Row>
              <Grid.Column>
                {cf && <ChartGen getChart={this.getPie} data={cf} />}
              </Grid.Column>
              <Grid.Column>
                {cf && <ChartGen getChart={this.getBarChart} data={cf} />}
              </Grid.Column>
            </Grid.Row>
          </Grid>
        </Container>
      </Container>
    )
  }
}

export default App;

const searchWrapper = document.querySelector(".search-input");
const inputBox = searchWrapper.querySelector("input");
const suggBox = searchWrapper.querySelector(".autocom-box");
const icon = searchWrapper.querySelector(".icon");
let linkTag = searchWrapper.querySelector("a");
const download = document.querySelector(".download");
const highS = document.querySelector('.high')
const lowS = document.querySelector('.low')
const openS = document.querySelector('.open')
const closeS = document.querySelector('.close')
const stockName = document.querySelector('.stock-name')

let webLink;
// const apiKey = 'Z29495VF7W9SFTHP' // key 1
const apiKey = 'LEC9VCWJYTEUYPS1' // key 2
var chart = null
let slectedName = null
let symbol = null
// search Key word
const SearchResults = (word = '') => {
  download.classList.add('activeButton')
  let searchList = []
  let emptyArrayData = [];
  let emptyArray = []
  let searchUrl = 'https://www.alphavantage.co/query?function=SYMBOL_SEARCH&keywords=' + word + '&apikey=' + apiKey;
  axios.get(searchUrl).
    then(response => {
      return response.data?.['bestMatches'];
      console.log(response.data, '[pass]')
    }).
    then(scData => {
      if (scData) {
        emptyArrayData = scData.map(ele => {
          return {
            value: ele,
            label: ele?.['1. symbol'] + ' | ' + ele?.['2. name'] + ', ' + ele?.['4. region'] + '(' + ele?.['8. currency'] + ')',
            symbol: ele?.['1. symbol']
          }
        })
        emptyArray = emptyArrayData.map((data) => {
          return data = `<li>${data.label}</li>`;
        });
        searchWrapper.classList.add("active"); //show autocomplete box
        showSuggestions(emptyArray);
        let allList = suggBox.querySelectorAll("li");
        for (let i = 0; i < allList.length; i++) {
          allList[i].setAttribute("onclick", 'select(this)');
        }
      } else {
        searchWrapper.classList.remove("active"); //hide autocomplete box
      }
    }).
    catch(error => {
      console.log(error, "[fail]")
      searchList = []
      return null;
    })
}

// fetch data from slected results
const fetchData = (symbol = '') => {
  if (chart !== null) {
    chart.destroy();
  }
  let fetchData = 'https://www.alphavantage.co/query?function=TIME_SERIES_MONTHLY&symbol=' + symbol + '&apikey=' + apiKey;
  axios.get(fetchData).
    then(response => {
      console.log(response.data, "[pass]")
      response.data;
      initValidation.getChartPoints(response.data)
    }).
    catch(error => {
      console.log(error, "[fail]")
    })
}


// downloadFile
download.onclick = (e) => {
  if (symbol !== null) {
    window.location = 'https://www.alphavantage.co/query?function=TIME_SERIES_MONTHLY&symbol=' + symbol + '&apikey=' + apiKey + '&datatype=csv'
  }
}
// AutoComplete SearchResults
inputBox.onkeyup = (e) => {
  let userData = e.target.value; //user enetered data
  SearchResults(userData)
}

function showSuggestions(list) {
  let listData;
  if (!list.length) {
    userValue = inputBox.value;
    listData = `<li>${userValue}</li>`;
  } else {
    listData = list.join('');
  }
  suggBox.innerHTML = listData;
}

function select(element) {
  let selectData = element.textContent;
  inputBox.value = selectData;
  let trimSymbol = selectData.split(' | ')[0]
  icon.onclick = () => {
    slectedName = selectData
    symbol = trimSymbol
    fetchData(trimSymbol)
    download.classList.remove('activeButton')
  }
  stockName.innerHTML = selectData.split(' | ')[1]
  searchWrapper.classList.remove("active");
}

const updateCard = (data) => {
  console.log(data, '[cordStocks]')
  highS.innerHTML = data['2. high']
  lowS.innerHTML = data['3. low']
  openS.innerHTML = data['1. open']
  closeS.innerHTML = data['4. close']
}

var initValidation = (function () {

  function graph(openP, closeP) {
    chart = new CanvasJS.Chart("chartContainer", {
      animationEnabled: true,
      theme: "light2",
      title: {
        text: slectedName ? slectedName : ""
      },
      axisX: {
        valueFormatString: "DD MMM",
        crosshair: {
          enabled: true,
          snapToDataPoint: true
        }
      },
      axisY: {
        title: "Opening stock price",
        includeZero: true,
        crosshair: {
          enabled: true
        }
      },
      toolTip: {
        shared: true
      },
      legend: {
        cursor: "pointer",
        verticalAlign: "bottom",
        horizontalAlign: "left",
        dockInsidePlotArea: true,
        itemclick: toogleDataSeries
      },
      data: [{
        type: "line",
        showInLegend: true,
        name: "Open",
        markerType: "square",
        xValueFormatString: "DD MMM, YYYY",
        color: "#F08080",
        dataPoints: openP
      }, {
        type: "line",
        showInLegend: true,
        name: "Close",
        lineDashType: "dash",
        dataPoints: closeP
      }]
    });

    function toogleDataSeries(e) {
      if (typeof (e.dataSeries.visible) === "undefined" || e.dataSeries.visible) {
        e.dataSeries.visible = false;
      } else {
        e.dataSeries.visible = true;
      }
      chart.render();
    }
    chart.render();
  }

  // Graph points
  const getChartPoints = (data) => {
    const date = data["Monthly Time Series"]
    let openPoints = []
    let closePoints = []
    let totalPoints = 40;
    console.log(Object.keys(date)[0])
    updateCard(date[Object.keys(date)[0]])
    for (let d in date) {
      totalPoints -= 1;
      let r = d.split("-");
      let value = date[d];
      openPoints.unshift({ x: new Date(parseInt(r[0]), parseInt(r[1]) - 1, parseInt(r[2])), y: parseFloat(value["1. open"]) });
      closePoints.unshift({ x: new Date(parseInt(r[0]), parseInt(r[1]) - 1, parseInt(r[2])), y: parseFloat(value["4. close"]) })
      if (totalPoints == 0) break;
    }
    graph(openPoints, closePoints)
  }
  return { getChartPoints }
})()

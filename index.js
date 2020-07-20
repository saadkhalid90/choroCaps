async function readAndDraw(){

  //defining projections for Asia and zoomed SG and HK
  //Asia
  const projection = d3.geoMercator()
                     	.scale(150 * 2.4)
                     	.center([91,35]);

  //SG and HK
  const projHK = d3.geoMercator()
                     	.scale(150 * 15)
                     	.center([110.15, 25.33]);

  const projSg = d3.geoMercator()
                     	.scale(150 * 20)
                     	.center([101.8198, 5]);

  // path functions for each projection
  const path = d3.geoPath().projection(projection);
  const pathHK = d3.geoPath().projection(projHK);
  const pathSg = d3.geoPath().projection(projSg);

  // read in the data
  const asiaMap = await d3.json('AsiaM.topojson');
  const SG = await d3.json('SG.topojson');
  const HK = await d3.json('HK.topojson');
  const categs = await d3.csv('econCategs.csv');

  // extract features
  const asiaFeatures = topojson.feature(asiaMap, asiaMap.objects.AsiaM).features;
  const HKFeat = topojson.feature(HK, HK.objects.HK).features;
  const SgFeat = topojson.feature(SG, SG.objects.SG).features;

  // list of all countries in the map
  const allMapCountries = asiaFeatures.map(d => d.properties.ADMIN);

  // countries in DGI 2018
  const countriesOld = [
    "China",
    "Hong Kong S.A.R.",
    "India",
    "Indonesia",
    "Japan",
    "South Korea",
    "Malaysia",
    "Myanmar",
    "Pakistan",
    "Philippines",
    "Singapore",
    "Sri Lanka",
    "Taiwan",
    "Thailand",
    "Vietnam"
  ];

  // new countries in DGI 2020
  const countriesNew = [
    "Bangladesh",
    "Cambodia",
    "Nepal"
  ]

  // Countries in DGI 2020
  const countriesAll = [...countriesOld, ...countriesNew].sort();


  // array defining map steps
  const steps = [
    {
      countries: [],
      countriesNew: [],
      countriesGrey: allMapCountries.filter(d => !countriesAll.includes(d)),
      notDoingEnough: ["Cambodia", "Nepal"],
      doingOkay: ["Bangladesh", "China", "India", "Indonesia", "Malaysia", "Myanmar", "Sri Lanka", "Thailand"],
      doingBetter: ["Hong Kong S.A.R.", "Japan", "South Korea", "Pakistan", "Philippines", "Vietnam"],
      doingWell: ["Singapore", "Taiwan"],
      default: []
    }
  ];

  // color scale for DGI clusters
  const colScale = d3.scaleOrdinal()
                    .domain([
                      "Not Doing Enough",
                      "Doing Okay",
                      "Doing Better",
                      "Doing Well"
                    ])
                    .range([
                      '#12471a',
                      '#3399ff',
                      '#00196e',
                      '#ff9900'
                    ]);


  let svg = d3.select('svg.choroCaps');
  const ctryGrp = svg.append('g').attr('class', 'ctryGrp');
  const defaultCol = '#d7d7d7';

  const worldPath = ctryGrp.selectAll('path.country')
    .data(asiaFeatures)
    .enter()
    .append('path')
    .attr('d', d => path(d))
    .attr('class', d => countriesAll.includes(d.properties.ADMIN) ? `active ${d.properties.ADMIN}` : d.properties.ADMIN)
    .classed('country', true)
    .style('stroke-opacity', 1)
    .style('stroke', '#fff')
    .style('stroke-width', '0.5px')
    .style('fill', defaultCol)
    .style('fill-opacity', 1)

    const hKSgGrp = svg.append('g').attr('class', 'hKSgGrp');

    const HKPath = hKSgGrp.selectAll('path.HK')
      .data(HKFeat)
      .enter()
      .append('path')
      .attr('d', d => pathHK(d))
      .style('fill', defaultCol)
      .attr('class', d => d.properties.ADMIN)
      .classed('country', true)
      .classed('active', true)
      .style('stroke-opacity', 1)
      .style('stroke', 'white')
      .style('stroke-width', '0.5px');

    const sGPath = hKSgGrp.selectAll('path.Sg')
      .data(SgFeat)
      .enter()
      .append('path')
      .classed('Sg', true)
      .attr('d', d => pathSg(d))
      .style('fill', defaultCol)
      .attr('class', d => d.properties.ADMIN)
      .classed('country', true)
      .classed('active', true)
      .style('stroke-opacity', 1)
      .style('stroke', 'white')
      .style('stroke-width', '0.5px');

    const HKBox = HKPath.node().getBBox();
    const SgBox = sGPath.node().getBBox();
    const radBuffer = -5 ;

    const locCircData = [
      {loc: "Hong Kong", center: bBoxCenter(HKBox), radius: d3.max([HKBox.width, HKBox.height]) + radBuffer},
      {loc: "Singapore", center: bBoxCenter(SgBox), radius: d3.max([SgBox.width, SgBox.height]) + radBuffer}
    ];

    hKSgGrp.selectAll('circle.locCircle')
          .data(locCircData)
          .enter()
          .append('circle')
          .attr('class', 'locCircle')
          .attrs({
            cx: d => d.center[0],
            cy: d => d.center[1],
            r: d => d.radius
          })
          .styles({
            fill: 'none',
            stroke: '#212121'
          });

    switchMapState(d3.selectAll('path.country'), steps, 0);

    //eventDetection


    d3.selectAll('path.country').on('click', function(d, i){
      const datum = d3.select(this).datum();
      console.log(path.centroid(datum));
    })


    function switchMapState(mapSelection, stateMap, index){
      const state = stateMap[index];
      mapSelection
                  .style('fill', (d, i) => {
                    const country = d.properties.ADMIN;
                    console.log(country);
                    if (state.countries.includes(country)){
                      return '#00695c'; //#37474f, #455a64, #006064, #00695c, #0d47a1, #4527a0
                    }
                    else if (state.countriesGrey.includes(country)){
                      return '#eeeeee';
                    }
                    else if (state.countriesNew.includes(country)){
                      return '#99ff00';
                    }
                    else if (state.notDoingEnough.includes(country)){
                      return '#12471a';
                    }
                    else if (state.doingOkay.includes(country)){
                      return '#3399ff';
                    }
                    else if (state.doingBetter.includes(country)){
                      return '#00196e';
                    }
                    else if (state.doingWell.includes(country)){
                      return '#ff9900';
                    }
                    else if (state.default.includes(country)){
                      return defaultCol;
                    }
                  });
    }


    function bBoxCenter(bBox){
      return [
        bBox.x + (bBox.width/2),
        bBox.y + (bBox.height/2)
      ]
    }
}

readAndDraw();

function getCateg(data, country, type){
  const datum = data.filter(d => d.ADMIN == country)[0];
  return datum[type];
}

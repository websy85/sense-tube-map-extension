define( [
	"qlik",
	"./tube-map-viz.min"

],
function ( qlik ) {
	return {
		initialProperties: {
			qHyperCubeDef: {
        qStateName: "$"
			}
		},
		definition: {
			type: "items",
			component: "accordion",
			items: {
        dimensions:{
          uses: "dimensions",
          min: 2
        },
        measures:{
          uses: "measures",
          min: 0
        }
      }
    },
    mounted: function($element){
			var that = this
			this.$scope.ready = true
			this.$scope.currApp = qlik.currApp();
      this.$scope.baseObject;
      this.$scope.baseObjectLayout;
      this.$scope.dimensionCount;
      this.$scope.measureCount;
      this.$scope.session;
      this.$scope.mapViz = new window.TubeMapViz({
        stationRadius: 15,
        stationThickness: 10,
        lineWidth: 8,
        lineSpacing: 8,
        fontSize: 14,
				stationClicked: function(station){
					that.$scope.$parent.backendApi.selectValues(1, [station.elemNum], true)
				}
      });
      this.$scope.origHandle = this.$scope.$parent.backendApi.model.handle;
      this.$scope.copyObject = function(callbackFn){
        //create a new alternate state
        that.$scope.currApp.model.enigmaModel.addAlternateState("TubeState").then(function(response){
          that.$scope.$parent.backendApi.model.getProperties().then(function(props){
            var baseHyperCubeDef = {
              qHyperCubeDef: cloneObject(props.qHyperCubeDef)
            };
            baseHyperCubeDef.qHyperCubeDef.qStateName = "TubeState";
            props.baseHyperCube = baseHyperCubeDef;
            that.$scope.$parent.backendApi.model.setProperties(props).then(function(response){
              that.$scope.$parent.backendApi.model.getLayout().then(function(layout){
      					that.$scope.ready = true
                that.$scope.dimensionCount = props.qHyperCubeDef.qDimensions.length;
                that.$scope.measureCount = props.qHyperCubeDef.qMeasures.length;
                that.$scope.getAllData("/baseHyperCube/qHyperCubeDef", layout.baseHyperCube.qHyperCube, 0, callbackFn);
              });
            });
          });    
        });

        function cloneObject(inObj){
          var outObj = {};
          for (var key in inObj){
            outObj[key] = inObj[key]
          }
          return outObj;
        }
      }

      this.$scope.getAllData = function(path, hc, lastRow, callbackFn){
        if(!hc){
          callbackFn.call();
        }
        if(lastRow==0){
          hc.qDataPages = [];
        }
        var pages = [{
          qTop: lastRow,
          qLeft: 0,
          qHeight: 100,
          qWidth: 10
        }];
        // $scope.session.rpc({handle: handle, method: "GetHyperCubeData", params: ["/qHyperCubeDef", pages]}).then(function(response){
        that.$scope.$parent.backendApi.model.getHyperCubeData(path, pages).then(function(pages){
          var data = pages[0];
          lastRow+=data.qArea.qHeight;
          hc.qDataPages.push(data);
          if(lastRow < hc.qSize.qcy){
            that.$scope.getAllData(path, hc, lastRow, callbackFn);
          }
          else{
            callbackFn.call(null);
          }
        }).catch(function(err){
          console.log(err);
        });
      };

			that.$scope.renderMap = function(element, layout){
			  var lines = [];
			  var linesLoaded = [];
			  layout.baseHyperCube.qHyperCube.qDataPages.forEach(function(page){
			    page.qMatrix.forEach(function(row){
			      var line;
			      if(linesLoaded.indexOf(row[0].qText)!=-1){
			        line = lines[linesLoaded.indexOf(row[0].qText)];
			      }
			      else if(row[0].qText!="-" && row[1].qText!="-"){
			        line = {
			          name: row[0].qText,
			          stations: []
			        }
			        if(row[2] && that.$scope.dimensionCount > 2){
			          line.colour = row[2].qText;
			        }
			        lines.push(line);
			        linesLoaded.push(row[0].qText);
			      }

			      if(line && row[1].qText!="-"){
			        var station = {
			          name: row[1].qText,
			          elemNum: row[1].qElemNumber,
			          status: 0
			        }
			        if(row[3] && that.$scope.dimensionCount > 3){
			          station.distanceToNext = parseInt(row[3].qText);
			        }
			        line.stations.push(station);
			      }
			    });
			  });
			  that.$scope.getAllData("/qHyperCubeDef", layout.qHyperCube, 0, function(){
			      var processedStations = [];
			      var minVal = 1, maxVal = 1, scale = 1, maxMultiplier = 3, shouldScale = false;
			      if(that.$scope.measureCount > 0){
			        //we only use the first measure at the moment
			        minVal = layout.qHyperCube.qMeasureInfo[0].qMin;
			        maxVal = layout.qHyperCube.qMeasureInfo[0].qMax;
			        scale = (maxMultiplier - 1) / maxVal;
			        shouldScale = true;
			      }
			      //now compare the dollarHypercube to the lines array and update the status where necessary
			      layout.qHyperCube.qDataPages.forEach(function(page){
			        page.qMatrix.forEach(function(row){
			          var line = lines[linesLoaded.indexOf(row[0].qText)];
			          if(line){
			            switch (row[1].qState) {
			              case "X":
			              case "A":
			              case "XS":
			                for (var i=0;i<line.stations.length;i++){
			                  if(line.stations[i].name==row[1].qText){
			                    line.stations[i].status = 0;
			                    processedStations.push(row[1].qText);
			                  }
			                }
			                break;
			              default:
			                for (var i=0;i<line.stations.length;i++){
			                  if(line.stations[i].name==row[1].qText){
			                    line.stations[i].status = 1;
			                    if(shouldScale){
			                      line.stations[i].custom = {
			                        scale: 1 + (row[that.$scope.dimensionCount].qNum * scale)
			                      }
			                    }
			                    processedStations.push(row[1].qText);
			                  }
			                }
			                break;
			            }
			          }
			        });
			      });      
			      that.$scope.mapViz.render(lines, element[0]);
			    });
			};

    },
    paint: function(element, layout){
			if (this.$scope.ready === false) {
				return
			}
			this.$scope.ready = false
      var that = this;
      if(this._inEditState===true){
        element[0].style.zIndex = -1;
				element[0].parentElement.parentElement.parentElement.style.backgroundColor = "transparent";
      }
      else {
        element[0].style.zIndex = null;
				element[0].parentElement.parentElement.parentElement.style.backgroundColor = "inherit";
      }
      if(this.$scope.baseObject && this._inEditState===false){
        this.$scope.renderMap(element, layout);
      }
      else{
        this.$scope.copyObject(function(){
          that.$scope.renderMap(element, layout);
        });
      }
    }
  }
});

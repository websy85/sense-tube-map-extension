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
    controller: function($scope){
			$scope.currApp = qlik.currApp();
      $scope.baseObject;
      $scope.baseObjectLayout;
      $scope.dimensionCount;
      $scope.measureCount;
      $scope.session;
      $scope.mapViz = new window.TubeMapViz({
        stationRadius: 15,
        stationThickness: 10,
        lineWidth: 8,
        lineSpacing: 8,
        fontSize: 14,
				stationClicked: function(station){
					$scope.$parent.backendApi.selectValues(1, [station.elemNum], true)
				}
      });
      $scope.origHandle = $scope.$parent.backendApi.model.handle;
      $scope.copyObject = function(callbackFn){
        //create a new alternate state
        $scope.currApp.model.enigmaModel.addAlternateState("TubeState").then(function(response){
          $scope.$parent.backendApi.model.getProperties().then(function(props){
            var baseHyperCubeDef = {
              qHyperCubeDef: cloneObject(props.qHyperCubeDef)
            };
            baseHyperCubeDef.qHyperCubeDef.qStateName = "TubeState";
            props.baseHyperCube = baseHyperCubeDef;
            $scope.$parent.backendApi.model.setProperties(props).then(function(response){
              $scope.$parent.backendApi.model.getLayout().then(function(layout){
                $scope.dimensionCount = props.qHyperCubeDef.qDimensions.length;
                $scope.measureCount = props.qHyperCubeDef.qMeasures.length;
                $scope.getAllData("/baseHyperCube/qHyperCubeDef", layout.baseHyperCube.qHyperCube, 0, callbackFn);
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

      $scope.getAllData = function(path, hc, lastRow, callbackFn){
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
        $scope.$parent.backendApi.model.getHyperCubeData(path, pages).then(function(pages){
          var data = pages[0];
          lastRow+=data.qArea.qHeight;
          hc.qDataPages.push(data);
          if(lastRow < hc.qSize.qcy){
            $scope.getAllData(path, hc, lastRow, callbackFn);
          }
          else{
            callbackFn.call(null);
          }
        }).catch(function(err){
          console.log(err);
        });
      };

			$scope.renderMap = function(element, layout){
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
			        if(row[2] && $scope.dimensionCount > 2){
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
			        if(row[3] && $scope.dimensionCount > 3){
			          station.distanceToNext = parseInt(row[3].qText);
			        }
			        line.stations.push(station);
			      }
			    });
			  });
			  $scope.getAllData("/qHyperCubeDef", layout.qHyperCube, 0, function(){
			      var processedStations = [];
			      var minVal = 1, maxVal = 1, scale = 1, maxMultiplier = 3, shouldScale = false;
			      if($scope.measureCount > 0){
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
			                        scale: 1 + (row[$scope.dimensionCount].qNum * scale)
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
			      console.log(lines);
			      $scope.mapViz.render(lines, element[0]);

			    });
			};

    },
    paint: function(element, layout){
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

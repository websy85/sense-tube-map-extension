define( [
	"./tube-map-viz.min"
],
function ( T ) {

	return {
		initialProperties: {
			version: 1.0,
      qInfo: {
        qType: "Chart"
      },
			qHyperCubeDef: {
        qStateName: "$",
				qDimensions: [],
				qMeasures: []
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
      $scope.baseObjectHandle;
      $scope.baseObjectLayout;
      $scope.dimensionCount;
      $scope.measureCount;
      $scope.session;
      $scope.mapViz = new window.TubeMapViz({
        stationRadius: 15,
        stationThickness: 10,
        lineWidth: 8,
        lineSpacing: 8,
        fontSize: 14
      });
      $scope.origHandle = $scope.$parent.backendApi.model.handle;
      $scope.copyObject = function(callbackFn){
        $scope.session = $scope.$parent.backendApi.model.session;
        var docHandle = $scope.session.currentApp.handle;
        var dummyDef = {
          qInfo:{
            qType: "Chart"
          }
        }
        //create a new alternate state
        $scope.session.rpc({handle: docHandle, method: "AddAlternateState", params:["TubeState"]}).then(function(response){
          //create the base object that will contain all of the map data
          $scope.session.rpc({handle: docHandle, method: "CreateSessionObject", params:[dummyDef]}).then(function(response){
            $scope.baseObjectHandle = response.result.qReturn.qHandle;
            var newId = response.result.qReturn.qGenericId;
            $scope.session.rpc({handle: $scope.origHandle, method: "GetProperties", params:[]}).then(function(response){
              var props = response.result.qProp;
              props.qInfo.qId = newId;
              $scope.session.rpc({handle: $scope.baseObjectHandle, method: "SetProperties", params:[props]}).then(function(response){
                //put the base object against the alternate state
                $scope.session.rpc({handle: $scope.baseObjectHandle, method: "ApplyPatches", params:[[{qPath:"/qHyperCubeDef/qStateName", qOp: "add", qValue: "\"TubeState\""}]]}).then(function(response){
                  $scope.session.rpc({handle: $scope.baseObjectHandle, method: "GetLayout", params:[]}).then(function(response){
                    $scope.baseObjectLayout = response.result.qLayout;
                    $scope.dimensionCount = $scope.baseObjectLayout.qHyperCube.qDimensionInfo.length;
                    $scope.measureCount = $scope.baseObjectLayout.qHyperCube.qMeasureInfo.length;
                    $scope.getAllData($scope.baseObjectLayout, $scope.baseObjectHandle, 0, callbackFn);
                  });
                });
              });
            });
          });
        });
      }

      $scope.getAllData = function(layout, handle, lastRow, callbackFn){
        if(!layout.qHyperCube){
          callbackFn.call();
        }
        if(lastRow==0){
          layout.qHyperCube.qDataPages = [];
        }
        var pages = [{
          qTop: lastRow,
          qLeft: 0,
          qHeight: 100,
          qWidth: 10
        }];
        $scope.session.rpc({handle: handle, method: "GetHyperCubeData", params: ["/qHyperCubeDef", pages]}).then(function(response){
          var data = response.result.qDataPages[0];
          lastRow+=data.qArea.qHeight;
          layout.qHyperCube.qDataPages.push(data);
          if(lastRow < layout.qHyperCube.qSize.qcy){
            $scope.getAllData(layout, handle, lastRow, callbackFn);
          }
          else{
            callbackFn.call(null, layout);
          }
        }).catch(function(err){
          console.log(err);
        });
      };

			$scope.renderMap = function(element, layout){
			  var lines = [];
			  var linesLoaded = [];
			  $scope.baseObjectLayout.qHyperCube.qDataPages.forEach(function(page){
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
			          status: 0
			        }
			        if(row[3] && $scope.dimensionCount > 3){
			          station.distanceToNext = parseInt(row[3].qText);
			        }
			        line.stations.push(station);
			      }
			    });
			  });
			  $scope.getAllData(layout, $scope.origHandle, 0, function(layout){
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
      }
      else {
        element[0].style.zIndex = null;
      }
      if(this.$scope.baseObjectHandle && this._inEditState===false){
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

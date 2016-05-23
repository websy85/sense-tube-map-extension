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

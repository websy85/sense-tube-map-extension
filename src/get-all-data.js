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

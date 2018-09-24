const soccerLeagueModule = require('./SoccerLeagueModule')

//In node, the first two arguments are node path and file path
switch(process.argv[2]){
  case 'score':
    soccerLeagueModule.calcLeagueScores(process.argv[3], (rankingMap)=>{
      console.log(rankingMap.toString());
    });
    break;

  case 'test':
    soccerLeagueModule.testEverything();
    break;

  default:
    console.log('Invalid Command Please Run With \n' +
    'node SoccerLeagueProgram.js score [filename]')
    break;
}

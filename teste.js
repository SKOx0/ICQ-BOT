String.prototype.contains = function(strPattern){
  if(typeof strPattern !== 'string') return false;
  
  var pattern = new RegExp(strPattern, "i");

  return pattern.test(this);
}

console.log("teste".contains("teste"));
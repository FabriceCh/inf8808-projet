/** Capitalize */
String.prototype.capitalize = function () {
    return this.charAt(0).toUpperCase() + this.slice(1)
  };
  
  /**
   * Generate a number between a and b
   * 
   * @param {*} a 
   * @param {*} b 
   */
  function numberBetween(a, b) {
    return Math.floor(Math.random() * b) + a
  }
  
  /**
   * Generate a tupple of ordered numbers between a and b
   * 
   * @param {*} a 
   * @param {*} b 
   */
  function generateRange(a, b) {
    let a_ = numberBetween(a, b);
    let b_ = numberBetween(a, b);
  
    if (a_ >= b_) {
      return [b_, a_]
    }
    return [a_, b_]
  }
  
  function getUnitFormNode(data, node) {
    let unitId = d3.select(node).node()[0].parentNode.parentNode.parentNode.getAttribute('data-unit-id');
    return data.units.filter(u => u.id == unitId)[0];
  }
  
  function uniq(a) {
    let seen = {};
    return a.filter(function(item) {
        return seen.hasOwnProperty(item) ? false : (seen[item] = true);
    })
  }
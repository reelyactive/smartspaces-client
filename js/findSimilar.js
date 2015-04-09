/**
 * Copyright reelyActive 2014
 * We believe in an open Internet of Things
 */

/**
 * Function to find objects which share the same attributes.
 * @param {Array} data An array containing all the json objects.
 * @param {Array} excludedAttributes The attributes that we can ignore / not interested
 * in finding similarities
 *
 * It returns an object of the form:
 *
 * {
 *		attribute1 : {
 *      	"sameValue1" : ["id_of_object_A", "id_of_object_B"]   	
 *		},
 *		...
 * }
 *
 * attribute1, attribute2, ... are the attributes of the input json objects
 * sameValue1, sameValue2, ... are the values which the input json objects share in common for that particular attribute
 *  
*/
function findSimilar(data,excludedAttributes) {
	var result = {};

	// Iterate through each object
	data.forEach(function(person) {

		// Iterate through each attribute category (e.g. name, surname, ...)
		for(var attributeCategory in person){

			// Skip attributes that we don't care about (e.g. id)
			if (excludedAttributes.indexOf(attributeCategory) > -1)
				continue;

			// Get the value of the attribute category (e.g. George, Jeff, ...)
			var attribute = person[attributeCategory];

			// Check if the attribute category is already in the array
			if (result[attributeCategory] == undefined) {

				// Create a new attribute category
				result[attributeCategory] = {};

				// Create a new attribute in the category (e.g. George, Jeff, )
				// This is what the objects share in common
				result[attributeCategory][attribute] = [];

				// Add the id of the object
				result[attributeCategory][attribute].push(person.id);
			} else {

				// Check if the attribute in the category is already in the array
				if (result[attributeCategory][attribute] == undefined) {

					// Create a new attribute in the category (e.g. George, Jeff, )
					// This is what the objects share in common
					result[attributeCategory][attribute] = [];

					// Add the id of the object
					result[attributeCategory][attribute].push(person.id);
				} else {

					// We have found two objects which have something in common!
					result[attributeCategory][attribute].push(person.id);
				}
			}
		}
	});

	// Clean-up the results, so that we end-up 
	// only with objects sharing common attributes
	result = cleanup(result);

	return result;
}

// Remove single entries
function cleanup(dirtyObj) {

	// Iterate through each attribute category (e.g. name, surname, ...)
	for(var attributeCategory in dirtyObj){

		// Iterate through each attribute in the category (e.g. Jeff, George, ...)
		for(var attribute in dirtyObj[attributeCategory]){

			// If the array containing the ID's has a length of one, delete the attribute
			if (dirtyObj[attributeCategory][attribute].length == 1) {
				delete dirtyObj[attributeCategory][attribute];

				// If the category has no objects, delete it
				if (Object.keys(dirtyObj[attributeCategory]).length == 0)
					delete dirtyObj[attributeCategory];
			}
		}

	}
	return dirtyObj;
}
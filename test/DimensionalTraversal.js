/**
 * Traverse an n-dimensional space from one integer point to another and do some work at every
 * intermediate integer point.
 *
 * Examples:
 * > dimensionalTraversal([1,1], [3,3], console.log)
 * [ 1, 1 ]
 * [ 1, 2 ]
 * [ 1, 3 ]
 * [ 2, 1 ]
 * [ 2, 2 ]
 * [ 2, 3 ]
 * [ 3, 1 ]
 * [ 3, 2 ]
 * [ 3, 3 ]
 *
 * > dimensionalTraversal([5,5,5], [6,7,8], console.log)
 * [ 5, 5, 5 ]
 * [ 5, 5, 6 ]
 * [ 5, 5, 7 ]
 * [ 5, 5, 8 ]
 * [ 5, 6, 5 ]
 * [ 5, 6, 6 ]
 * [ 5, 6, 7 ]
 * [ 5, 6, 8 ]
 * [ 5, 7, 5 ]
 * [ 5, 7, 6 ]
 * [ 5, 7, 7 ]
 * [ 5, 7, 8 ]
 * [ 6, 5, 5 ]
 * [ 6, 5, 6 ]
 * [ 6, 5, 7 ]
 * [ 6, 5, 8 ]
 * [ 6, 6, 5 ]
 * [ 6, 6, 6 ]
 * [ 6, 6, 7 ]
 * [ 6, 6, 8 ]
 * [ 6, 7, 5 ]
 * [ 6, 7, 6 ]
 * [ 6, 7, 7 ]
 * [ 6, 7, 8 ]
 *
 * @author ldub
 */

/**
 * @param start     vector. i'th element is the traversal starting point for the i'th dimension
 * @param end       vector. i'th element is the upper traversal limit for the i'th dimension
 * @param increment vector. i'th element is the traversal step for the i'th dimension
 * @param dimension iterator variable keeping track of the current dimension to traverse
 * @param acc       accumulator variable that stores a point
 * @param workFn    work to perform on every integer point. traverse passes point array to function
 */
let helper = (start, end, increment, dimension, acc, workFn) => {
    for (let i = start[dimension]; i <= end[dimension]; i += increment[dimension]) {
        acc[dimension] = i;

        if (dimension === end.length - 1) {
            workFn(acc);
        } else {
            helper(start, end, increment, dimension + 1, acc, workFn);
        }
    }
};

/**
 * Traverses an n-dimensional space, starting at a given point and ending at given limits, and calls the
 * given work function at each point.
 *
 * @param start     n-element array. i'th element is the traversal starting point for the i'th dimension
 * @param end       n-element array. i'th element is the upper traversal limit for the i'th dimension
 * @param increment vector. i'th element is the traversal step for the i'th dimension. increment by 1 if null
 * @param workFn    work to perform on every integer point. traverse passes point array to function
 */
let dimensionalTraversal = (start, end, increment, workFn) => helper(start, end, increment || new Array(start.length).fill(1), 0, [], workFn);

module.exports = { dimensionalTraversal };
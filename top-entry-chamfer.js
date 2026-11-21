// The cylindrical stock gauge leaves at least 1 mm of web around and below
// the chamfer. Use actual joined stock and actual cutters, including rotated
// sockets and channels, because nominal bounds cannot prove those clearances.
export function topEntryChamfer({stock,bore,radius,amount,cylinder,profile,otherCuts,hold}){
 const overshoot=.1,web=1;
 const guardRadius=radius+amount+web;
 const common=hold(stock.intersect(bore));
 if(common.isEmpty())return null;
 const top=common.boundingBox().max[1];
 const depth=amount+web;
 const guard=cylinder(top-depth,top,guardRadius);
 const approach=cylinder(top,Math.max(top+overshoot,stock.boundingBox().max[1]+overshoot),
  guardRadius);
 const epsilon=1e-5;
 if(hold(guard.subtract(stock)).volume()>epsilon||
    hold(stock.intersect(approach)).volume()>epsilon||
    otherCuts.some(cut=>hold(guard.intersect(cut)).volume()>epsilon))return null;
 const bounds=bore.boundingBox();
 if(bounds.min[1]>=top-depth||bounds.max[1]<=top)return null;
 // Use one continuous profile. Unioning a separate cone with the bore can
 // create sub-precision triangles at the transition into the straight shaft.
 return profile([[bounds.min[1],radius],[top-amount,radius],
  [top+overshoot,radius+amount+overshoot]]);
}

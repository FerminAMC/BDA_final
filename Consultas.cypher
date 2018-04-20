// Total actors
MATCH(a:Person)-[:ACTED_IN]-(:Movie) RETURN count(DISTINCT a)

// Total producers
MATCH(p:Person)-[:PRODUCED]-(:Movie) RETURN count(DISTINCT p)

// Total directors
MATCH(d:Person)-[:DIRECTED]-(:Movie) RETURN count(DISTINCT d)

// Total movies
MATCH(m:Movies) REETURN count(m)

// Person with most movies written
MATCH(p)-[w:WROTE]->(m)
RETURN p.name, count(w) ORDER BY count(w) DESC LIMIT 2

// Top 5 movies with best rating
MATCH(p:Person)-[r:REVIEWED]-(m:Movie)
RETURN m.title, avg(r.rating) ORDER BY avg(r.rating) DESC LIMIT 5

// Who should Al Pacino know to meet Audrey Tautou
MATCH(al:Person{name:"Al Pacino"}), (audrey:Person{name:"Audrey Tautou"}), p =  shortestPath((al)-[*]-(audrey))
UNWIND nodes(p) as n
MATCH(n:Person)
WHERE n.name <> "Al Pacino" and n.name <> "Audrey Tautou"
RETURN n.name

// Actors that have produced and acted in the same movie
MATCH(a)-[:ACTED_IN]->(m)<-[:PRODUCED]-(p)
WHERE a = p RETURN a, m


from falkordb import FalkorDB

def main():
    # Connect to the local FalkorDB server
    db = FalkorDB(host="localhost", port=6379)

    # Select a graph dedicated to TraceOps AI
    graph = db.select_graph("traceops")

    # Create a small example graph
    graph.query("""
        MERGE (a:Alert {id: 'ALT-1001'})
        SET a.type = 'Suspicious Login',
            a.severity = 'high'
    """)

    graph.query("""
        MERGE (u:User {id: 'USR-001'})
        SET u.name = 'Alex Morgan',
            u.privileged = true
    """)

    graph.query("""
        MERGE (d:Device {id: 'DEV-001'})
        SET d.hostname = 'workstation-01'
    """)

    graph.query("""
        MERGE (s:System {id: 'SYS-001'})
        SET s.name = 'Payment Service',
            s.criticality = 'high'
    """)

    # Connect the entities with relationships
    graph.query("""
        MATCH (a:Alert {id: 'ALT-1001'}),
              (u:User {id: 'USR-001'})
        MERGE (a)-[:INVOLVES]->(u)
    """)

    graph.query("""
        MATCH (u:User {id: 'USR-001'}),
              (d:Device {id: 'DEV-001'})
        MERGE (u)-[:USES]->(d)
    """)

    graph.query("""
        MATCH (d:Device {id: 'DEV-001'}),
              (s:System {id: 'SYS-001'})
        MERGE (d)-[:CONNECTS_TO]->(s)
    """)

    # Follow three relationships in one query
    result = graph.query("""
        MATCH (a:Alert {id: 'ALT-1001'})
              -[:INVOLVES]->(u:User)
              -[:USES]->(d:Device)
              -[:CONNECTS_TO]->(s:System)
        RETURN a.id, u.name, d.hostname, s.name
    """)

    print("\n--- TraceOps AI: Graph Query Result ---")

    for row in result.result_set:
        print(f"Alert: {row[0]}")
        print(f"User: {row[1]}")
        print(f"Device: {row[2]}")
        print(f"Connected system: {row[3]}")

    if not result.result_set:
        print("No matching path found. Check the graph data.")
    
    graph.query("""
        MERGE (a:Alert {id: 'ALT-1002'})
        SET a.type = 'Unusual Device Activity',
            a.severity = 'medium'
    """)
    
    graph.query("""
        MATCH (a:Alert {id: 'ALT-1002'}),
              (u:User {id: 'USR-001'})
        MERGE (a)-[:INVOLVES]->(u)
    """)

    print("Second synthetic alert added: ALT-1002")
                

if __name__ == "__main__":
    main()

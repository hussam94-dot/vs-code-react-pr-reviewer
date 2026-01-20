import React, { useState, useEffect } from 'react';

interface UserData {
    id: number;
    name: string;
    email: string;
}

export default function UserProfile() {
    const [user, setUser] = useState<UserData | null>(null);
    const [loading, setLoading] = useState(true);
    const [count, setCount] = useState(0);

    // Issue 1: Missing dependency in useEffect
    useEffect(() => {
        fetchUserData();
    }, []);

    const fetchUserData = async () => {
        setLoading(true);
        try {
            const response = await fetch('https://api.example.com/user/123');
            const data = await response.json();
            setUser(data);
        } catch (error) {
            console.log('Error fetching user:', error);
        } finally {
            setLoading(false);
        }
    };

    // Issue 2: Unnecessary re-renders - no useMemo/useCallback
    const expensiveCalculation = () => {
        let result = 0;
        for (let i = 0; i < 1000000; i++) {
            result += i;
        }
        return result;
    };

    // Issue 3: Inline function in JSX (creates new function on every render)
    const handleClick = () => {
        setCount(count + 1);
    };

    if (loading) {
        return <div>Loading...</div>;
    }

    if (!user) {
        return <div>No user found</div>;
    }

    return (
        <div className="user-profile">
            <h1>{user.name}</h1>
            <p>Email: {user.email}</p>
            <p>Expensive calculation: {expensiveCalculation()}</p>

            <div>
                <p>Count: {count}</p>
                <button onClick={() => setCount(count + 1)}>Increment</button>
                <button onClick={handleClick}>Also Increment</button>
            </div>

            {/* Issue 4: Large component - could be split */}
            <div className="user-details">
                <h2>Additional Details</h2>
                <div className="stats">
                    <div className="stat-item">
                        <label>Posts</label>
                        <span>123</span>
                    </div>
                    <div className="stat-item">
                        <label>Followers</label>
                        <span>456</span>
                    </div>
                    <div className="stat-item">
                        <label>Following</label>
                        <span>789</span>
                    </div>
                </div>
            </div>
        </div>
    );
}

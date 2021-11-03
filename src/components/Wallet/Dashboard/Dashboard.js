import { useEffect } from 'react'
import './Dashboard.css'

export default function Dashboard({ balances }) {
    useEffect(() => {
        console.log(balances.filter(({ meta }) => meta.length && meta[0].value));
    }, [balances]);

    return (
        <section id="dashboard">

        </section>
    )
}
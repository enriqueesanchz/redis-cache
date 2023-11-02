docker exec timescaledb psql -c "CREATE MATERIALIZED VIEW kwh_day_by_day(time, value)
                                with (timescaledb.continuous) as
                                SELECT time_bucket('1 day', timestamp, 'Europe/Berlin') AS "time",
                                sum(kw) AS value
                                FROM solar_plants
                                GROUP BY 1;"

docker exec timescaledb psql -c "SELECT add_continuous_aggregate_policy('kwh_day_by_day',
                                start_offset => NULL,
                                end_offset => INTERVAL '1 hour',
                                schedule_interval => INTERVAL '1 hour');"

docker exec timescaledb psql -c "CREATE MATERIALIZED VIEW kwh_hour_by_hour(time, value)
                                with (timescaledb.continuous) as
                                SELECT time_bucket('01:00:00', solar_plants.timestamp, 'Europe/Berlin') AS "time",
                                sum(kw) AS value
                                FROM solar_plants
                                GROUP BY 1;"

docker exec timescaledb psql -c "SELECT add_continuous_aggregate_policy('kwh_hour_by_hour',
                                start_offset => NULL,
                                end_offset => INTERVAL '1 hour',
                                schedule_interval => INTERVAL '1 hour');"

docker exec timescaledb psql -c "WITH per_hour AS (
                                SELECT
                                time,
                                value
                                FROM kwh_hour_by_hour
                                WHERE "time" at time zone 'Europe/Berlin' > date_trunc('month', time) - interval '1 year'
                                ORDER BY 1
                                ), hourly AS (
                                SELECT
                                    extract(HOUR FROM time) * interval '1 hour' as hour,
                                    value
                                FROM per_hour
                                )
                                SELECT
                                    hour,
                                    approx_percentile(0.50, percentile_agg(value)) as median,
                                    max(value) as maximum
                                FROM hourly
                                GROUP BY 1
                                ORDER BY 1;"

docker exec timescaledb psql -c "WITH per_day AS (
                                SELECT
                                time,
                                value
                                FROM kwh_day_by_day
                                WHERE "time" at time zone 'Europe/Berlin' > date_trunc('month', time) - interval '1 year'
                                ORDER BY 1
                                ), daily AS (
                                    SELECT
                                    to_char(time, 'Dy') as day,
                                    value
                                    FROM per_day
                                ), percentile AS (
                                    SELECT
                                        day,
                                        approx_percentile(0.50, percentile_agg(value)) as median
                                    FROM daily
                                    GROUP BY 1
                                    ORDER BY 1
                                )
                                SELECT
                                    d.day,
                                    d.ordinal,
                                    pd.median
                                FROM unnest(array['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']) WITH ORDINALITY AS d(day, ordinal)
                                LEFT JOIN percentile pd ON lower(pd.day) = lower(d.day);"

docker exec timescaledb psql -c "WITH per_day AS (
                                SELECT
                                time,
                                value
                                FROM kwh_day_by_day
                                WHERE "time" > now() - interval '1 year'
                                ORDER BY 1
                                ), per_month AS (
                                SELECT
                                    to_char(time, 'Mon') as month,
                                    sum(value) as sum
                                FROM per_day
                                GROUP BY 1
                                )
                                SELECT
                                m.month,
                                m.ordinal,
                                pd.sum
                                FROM unnest(array['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']) WITH ORDINALITY AS m(month, ordinal)
                                LEFT JOIN per_month pd ON lower(pd.month) = lower(m.month)
                                ORDER BY ordinal;"
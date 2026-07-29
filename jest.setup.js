// Force a fixed timezone so date-arithmetic tests (due dates, loan payoff
// dates) give the same result on every machine and CI runner, regardless of
// the local system timezone.
process.env.TZ = "UTC";

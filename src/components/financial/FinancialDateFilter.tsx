
import React from "react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TimeFilter } from "@/types/financial";
import { format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { CalendarIcon } from "lucide-react";

interface FinancialDateFilterProps {
  timeFilter: TimeFilter;
  setTimeFilter: (filter: TimeFilter) => void;
  customStartDate: Date;
  customEndDate: Date;
  onCustomDateChange: (startDate: Date, endDate: Date) => void;
}

const FinancialDateFilter = ({
  timeFilter,
  setTimeFilter,
  customStartDate,
  customEndDate,
  onCustomDateChange
}: FinancialDateFilterProps) => {
  const [startDateOpen, setStartDateOpen] = React.useState(false);
  const [endDateOpen, setEndDateOpen] = React.useState(false);

  return (
    <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
      <Tabs
        defaultValue={timeFilter}
        value={timeFilter}
        onValueChange={(value) => setTimeFilter(value as TimeFilter)}
        className="w-auto"
      >
        <TabsList>
          <TabsTrigger value="month">Month</TabsTrigger>
          <TabsTrigger value="quarter">Quarter</TabsTrigger>
          <TabsTrigger value="year">Year</TabsTrigger>
          <TabsTrigger value="custom">Custom</TabsTrigger>
        </TabsList>
      </Tabs>

      {timeFilter === "custom" && (
        <div className="flex flex-wrap gap-2 items-center">
          <div className="flex items-center gap-2">
            <Popover open={startDateOpen} onOpenChange={setStartDateOpen}>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="w-[160px] justify-start">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {format(customStartDate, "MMM dd, yyyy")}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={customStartDate}
                  onSelect={(date) => {
                    if (date) {
                      onCustomDateChange(date, customEndDate);
                      setStartDateOpen(false);
                    }
                  }}
                  initialFocus
                />
              </PopoverContent>
            </Popover>

            <span>to</span>

            <Popover open={endDateOpen} onOpenChange={setEndDateOpen}>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="w-[160px] justify-start">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {format(customEndDate, "MMM dd, yyyy")}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={customEndDate}
                  onSelect={(date) => {
                    if (date) {
                      onCustomDateChange(customStartDate, date);
                      setEndDateOpen(false);
                    }
                  }}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>
      )}
    </div>
  );
};

export default FinancialDateFilter;

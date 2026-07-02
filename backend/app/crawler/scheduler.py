from apscheduler.schedulers.background import BackgroundScheduler
from app.crawler.mock_crawler import MockCrawler
import time

def start_scheduler():
    scheduler = BackgroundScheduler()
    crawler = MockCrawler()

    scheduler.add_job(
        crawler.crawl,
        trigger='cron',
        hour=8,
        minute=0,
        id='daily_price_update',
        name='每天早上8点更新价格'
    )

    crawler.crawl()

    scheduler.start()
    print("定时任务已启动，每天早上8点自动更新价格")

    try:
        while True:
            time.sleep(2)
    except (KeyboardInterrupt, SystemExit):
        scheduler.shutdown()

if __name__ == "__main__":
    start_scheduler()
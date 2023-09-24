class LinkedInJobScraper:
    def __init__(self, url, path_driver):
        self.url = url
        self.path_driver = path_driver
        self.driver = self._setup_driver()
        
    def _setup_driver(self):
        s = Service(self.path_driver)
        driver = webdriver.Chrome(service=s)
        return driver
    
    def _get_total_jobs(self):
        self.driver.get(self.url)
        job_count_text = self.driver.find_element(By.CLASS_NAME, "results-context-header__job-count").text
        clean_text = job_count_text.replace(',', '').replace('+', '')
        return int(clean_text)
    
    def _load_all_jobs(self, no_of_jobs):
        i = 2
        while i <= int(no_of_jobs / 25) + 1:
            self.driver.execute_script('window.scrollTo(0, document.body.scrollHeight);')
            i += 1
            try:
                self.driver.find_element(By.XPATH, '/html/body/div[1]/div/main/section[2]/button').click()
                time.sleep(5)
            except:
                pass
            time.sleep(5)
    
    def scrape_jobs(self):
        no_of_jobs = self._get_total_jobs()
        self._load_all_jobs(no_of_jobs)
        
        # Initializing data vectors
        job_title = []
        hiring_company = []
        job_location = []
        job_link = []
        recruiter = []
        description = []
        
        # clicking through all jobs in job list and scraping the details from the loaded job
        for count in range(1, no_of_jobs):
            try:
                path = f'/html/body/div[1]/div/main/section[2]/ul/li[{count}]/div/a'
                self.driver.find_element(By.XPATH, path).click()
            except NoSuchElementException:
                path = f'/html/body/div[1]/div/main/section[2]/ul/li[{count}]/a'
                self.driver.find_element(By.XPATH, path).click()
            time.sleep(5)
            
            try:
                self.driver.find_element(By.CSS_SELECTOR, 'button[data-tracking-control-name="public_jobs_show-more-html-btn"]').click()
                time.sleep(5)
                
                title = self.driver.find_element(By.CSS_SELECTOR, '.top-card-layout__title').text
                try:
                    company = self.driver.find_element(By.CSS_SELECTOR, '.topcard__flavor a').text
                except NoSuchElementException:
                    company = self.driver.find_element(By.CSS_SELECTOR, '.topcard__flavor').text
                
                location = self.driver.find_element(By.CSS_SELECTOR, ".topcard__flavor-row .topcard__flavor--bullet").text
                link = self.driver.find_element(By.XPATH, "//a[@class='topcard__link']").get_attribute('href')
                has_message_recruiter = len(self.driver.find_elements(By.CSS_SELECTOR, ".message-the-recruiter.message-the-recruiter--jserp")) > 0
                job_description = self.driver.find_element(By.CSS_SELECTOR, '.show-more-less-html__markup').text
                
                job_title.append(title)
                hiring_company.append(company)
                job_location.append(location)
                job_link.append(link)
                recruiter.append(has_message_recruiter)
                description.append(job_description)
                
            except ElementNotInteractableException:
                job_title.append(np.nan)
                hiring_company.append(np.nan)
                job_location.append(np.nan)
                job_link.append(np.nan)
                recruiter.append(np.nan)
                description.append(np.nan)
        
        df_job_posts = pd.DataFrame({
            'job_title': job_title,
            'hiring_company': hiring_company,
            'job_location': job_location,
            'job_link': job_link,
            'recruiter': recruiter,
            'description': description
        })
        
        self.driver.quit()
        
        return df_job_posts
